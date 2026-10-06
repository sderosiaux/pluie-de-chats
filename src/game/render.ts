// Rendu du monde (canvas 2D, coordonnées monde 360 × 640). Lit l'état de la sim, ne l'écrit jamais.

import { BALL_R, COOLDOWN_TICKS, LAUNCH_X, LAUNCH_Y, WORLD_H, WORLD_W } from '../sim';
import type { Cat, Prediction, SimState } from '../sim';
import type { Assets } from './assets';
import { drawOverlayFx, drawWorldFx } from './fx';
import type { Fx } from './fx';
import { drawHud } from './hud';
import { COLLARS, RAINBOW, THEME } from './look';
import type { Point, View } from './view';

/** État visuel d'un chat, propre au client (rotation, traînée, pose d'esquive). */
export interface CatLook {
  rot: number;
  trail: Point[];
  tro: number; // secondes restantes en pose `tro` (annonce d'esquive, §18)
}

export interface AimState {
  wx: number;
  wy: number;
  angle: number | null; // null = sous 7° : relâcher annule
  pred: Prediction | null;
}

export interface RenderInput {
  sim: SimState;
  assets: Assets;
  looks: Map<number, CatLook>;
  fx: Fx;
  aim: AimState | null;
  blink: boolean;
  time: number; // secondes réelles (nuages, pelote)
  catchable: number;
  fast: boolean; // « Finir l'averse » en cours
}

const SPRITE_K = 2.5; // taille du sprite ≈ 2,5 × r
const TRAIL_LEN = 7;
const SPIN_PER_SPEED = 0.012; // rad/s par px/s
const SCENERY_H = 92;

/** Met à jour rotations, traînées et poses à partir de l'état courant de la sim. */
export function updateLooks(sim: SimState, looks: Map<number, CatLook>, dt: number): void {
  const alive = new Set<number>();
  for (const c of sim.cats) {
    alive.add(c.id);
    let l = looks.get(c.id);
    if (!l) {
      l = { rot: 0, trail: [], tro: 0 };
      looks.set(c.id, l);
    }
    l.tro = Math.max(0, l.tro - dt);
    if (c.st === 'boulet') {
      const sp = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      l.rot += (c.vx >= 0 ? 1 : -1) * sp * SPIN_PER_SPEED * dt;
      l.trail.push({ x: c.x, y: c.y });
      if (l.trail.length > TRAIL_LEN) l.trail.shift();
    }
  }
  for (const id of looks.keys()) if (!alive.has(id)) looks.delete(id);
}

export function render(g: CanvasRenderingContext2D, view: View, dpr: number, r: RenderInput): void {
  const k = view.scale * dpr;
  g.setTransform(k, 0, 0, k, view.offX * dpr, view.offY * dpr);
  // Monde visible sur tout l'écran (coordonnées monde des bords de l'écran).
  const sx0 = -view.offX / view.scale, sy0 = -view.offY / view.scale;
  const sx1 = (view.width - view.offX) / view.scale, sy1 = (view.height - view.offY) / view.scale;

  g.save();
  g.translate(r.fx.shakeX, r.fx.shakeY);
  drawBackground(g, r.assets, r.time, sx0, sy0, sx1, sy1);
  g.restore();
  // Voile hors du monde : les murs et le plafond restent visibles sur écran large ou haut.
  g.fillStyle = THEME.letterboxVeil;
  g.beginPath();
  g.rect(sx0, sy0, sx1 - sx0, sy1 - sy0);
  g.rect(WORLD_W, 0, -WORLD_W, WORLD_H);
  g.fill('evenodd');

  g.save();
  g.beginPath();
  g.rect(0, 0, WORLD_W, WORLD_H);
  g.clip();
  g.translate(r.fx.shakeX, r.fx.shakeY);
  const chainN = new Map<number, number>();
  for (const ch of r.sim.chains) chainN.set(ch.id, ch.n);
  for (const c of r.sim.cats) if (c.st === 'boulet') drawTrail(g, c, r.looks.get(c.id), chainN.get(c.chainId) ?? 0);
  for (const c of r.sim.cats) drawCat(g, c, r.assets, r.looks.get(c.id), r.sim.tick);
  for (const b of r.sim.balls) drawPelote(g, r.assets, b.x, b.y, 2.5 * BALL_R, r.time * 9);
  drawLauncher(g, r);
  drawWorldFx(g, r.fx);
  g.restore();

  drawHud(g, r.sim, r.catchable, r.assets, r.fast);
  // La visée passe au-dessus du HUD : un contact prédit tout en haut doit rester lisible.
  if (r.aim) {
    g.save();
    g.beginPath();
    g.rect(0, 0, WORLD_W, WORLD_H);
    g.clip();
    g.translate(r.fx.shakeX, r.fx.shakeY);
    drawAim(g, r.aim, r.sim);
    g.restore();
  }
  drawOverlayFx(g, r.fx, WORLD_W / 2, 250);
}

// ── Décor ────────────────────────────────────────────────────────────────────

function drawBackground(g: CanvasRenderingContext2D, assets: Assets, time: number, x0: number, y0: number, x1: number, y1: number): void {
  const sky = g.createLinearGradient(0, 0, 0, WORLD_H);
  sky.addColorStop(0, THEME.skyTop);
  sky.addColorStop(1, THEME.skyBottom);
  g.fillStyle = sky;
  g.fillRect(x0 - 20, y0 - 20, x1 - x0 + 40, y1 - y0 + 40);

  g.fillStyle = THEME.cloud;
  const clouds: Array<[number, number, number, number]> = [[40, 130, 1, 4], [250, 220, 1.3, 2.5], [130, 360, 0.8, 3.2]];
  for (const [x0, y, s, speed] of clouds) {
    const x = ((x0 + time * speed) % (WORLD_W + 120)) - 60;
    cloud(g, x, y, s);
  }

  const img = assets.scenery;
  const w = (img.width * SCENERY_H) / img.height;
  g.globalAlpha = 0.6;
  const start = x0 - (((x0 % w) + w) % w) - w;
  for (let x = start; x < x1 + 20; x += w) g.drawImage(img, x, WORLD_H - SCENERY_H, w, SCENERY_H);
  g.fillStyle = assets.ground;
  g.fillRect(x0 - 20, WORLD_H - 1, x1 - x0 + 40, y1 - WORLD_H + 21);
  g.globalAlpha = 1;
}

function cloud(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.beginPath();
  g.ellipse(x, y, 34 * s, 12 * s, 0, 0, Math.PI * 2);
  g.ellipse(x - 14 * s, y - 6 * s, 16 * s, 12 * s, 0, 0, Math.PI * 2);
  g.ellipse(x + 10 * s, y - 10 * s, 18 * s, 15 * s, 0, 0, Math.PI * 2);
  g.fill();
}

// ── Chats ────────────────────────────────────────────────────────────────────

function drawTrail(g: CanvasRenderingContext2D, c: Cat, look: CatLook | undefined, n: number): void {
  if (!look || look.trail.length < 2) return;
  const collar = COLLARS[c.char];
  const rainbow = n >= 5;
  g.lineCap = 'round';
  const pts = look.trail;
  for (let i = 1; i < pts.length; i++) {
    const k = i / pts.length;
    g.globalAlpha = 0.15 + 0.55 * k;
    g.lineWidth = c.r * (0.35 + 0.75 * k);
    g.strokeStyle = rainbow
      ? RAINBOW[i % RAINBOW.length]
      : collar === null
        ? THEME.neutralTrail
        : collar.color === 'rainbow' ? RAINBOW[i % RAINBOW.length] : collar.color;
    g.beginPath();
    g.moveTo(pts[i - 1].x, pts[i - 1].y);
    g.lineTo(pts[i].x, pts[i].y);
    g.stroke();
  }
  g.globalAlpha = 1;
}

function drawCat(g: CanvasRenderingContext2D, c: Cat, assets: Assets, look: CatLook | undefined, tick: number): void {
  if (c.st === 'gone') return;
  const pose = c.st === 'fall' && look && look.tro > 0 ? 'tro' : 'mid';
  const img = assets.cat(c.costume, pose);
  const size = SPRITE_K * c.r;
  const rot = c.st === 'boulet' ? look?.rot ?? 0 : Math.sin((tick + c.id * 37) / 40) * 0.08;
  const ghost = c.char === 'fantome';

  if (ghost) {
    const halo = g.createRadialGradient(c.x, c.y, c.r * 0.4, c.x, c.y, c.r * 1.7);
    halo.addColorStop(0, 'rgba(200,220,255,0.55)');
    halo.addColorStop(1, 'rgba(200,220,255,0)');
    g.fillStyle = halo;
    g.beginPath();
    g.arc(c.x, c.y, c.r * 1.7, 0, Math.PI * 2);
    g.fill();
  }

  g.save();
  g.translate(c.x, c.y);
  g.rotate(rot);
  if (ghost) g.globalAlpha = 0.55;
  g.drawImage(img, -size / 2, -size / 2, size, size);
  g.restore();

  if (c.st === 'fall') drawCollar(g, c);
}

/** Repère de caractère (§8, §17) : anneau de la couleur du collier + médaille avec icône. */
function drawCollar(g: CanvasRenderingContext2D, c: Cat): void {
  const look = COLLARS[c.char];
  if (!look) return;
  const ringR = c.r * 1.12;
  const stroke = (i: number): string => (look.color === 'rainbow' ? RAINBOW[i % RAINBOW.length] : look.color);
  g.lineWidth = 3;
  if (look.color === 'rainbow') {
    for (let i = 0; i < RAINBOW.length; i++) {
      g.strokeStyle = stroke(i);
      g.beginPath();
      g.arc(c.x, c.y, ringR, (i / RAINBOW.length) * Math.PI * 2, ((i + 1) / RAINBOW.length) * Math.PI * 2);
      g.stroke();
    }
  } else {
    g.strokeStyle = look.color;
    g.beginPath();
    g.arc(c.x, c.y, ringR, 0, Math.PI * 2);
    g.stroke();
  }

  if (c.char === 'bouclier' && c.shield) {
    g.strokeStyle = '#b8c4d4';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(c.x, c.y, c.r * 1.35, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  }

  const mx = c.x + ringR * 0.72, my = c.y + ringR * 0.72;
  const mr = 7.5;
  // Médaille pleine de la couleur du collier ; pour le gros, la médaille est elle-même le ⬤.
  g.fillStyle = stroke(0);
  g.strokeStyle = THEME.paper;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(mx, my, mr, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  if (look.icon && look.icon !== 'dot') {
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `10px ${THEME.fontText}`;
    g.fillStyle = THEME.ink;
    g.fillText(look.icon, mx, my + 0.5);
  }
}

function drawPelote(g: CanvasRenderingContext2D, assets: Assets, x: number, y: number, size: number, rot: number): void {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.drawImage(assets.pelote, -size / 2, -size / 2, size, size);
  g.restore();
}

// ── Visée (§13) ──────────────────────────────────────────────────────────────

function drawAim(g: CanvasRenderingContext2D, aim: AimState, sim: SimState): void {
  if (aim.angle === null || !aim.pred) {
    g.setLineDash([4, 8]);
    g.strokeStyle = THEME.aimCancel;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(LAUNCH_X, LAUNCH_Y);
    g.lineTo(aim.wx, aim.wy);
    g.stroke();
    g.setLineDash([]);
    return;
  }
  const p = aim.pred;
  g.fillStyle = THEME.aim;
  for (let i = 1; i < p.path.length; i++) {
    const q = p.path[i];
    g.beginPath();
    g.arc(q.x, q.y, i % 2 === 0 ? 2.4 : 1.6, 0, Math.PI * 2);
    g.fill();
  }

  // Trouillards qui vont esquiver ce tir : « ! » au-dessus d'eux.
  for (const id of p.dodges) {
    const c = sim.cats.find(k => k.id === id);
    if (c) bang(g, c.x, c.y - c.r * 1.6);
  }

  if (p.kind === 'none') return;
  const target = sim.cats.find(k => k.id === p.catId);
  const r = target?.r ?? 18;
  const bad = p.kind === 'dog' || p.dodges.includes(p.catId);
  const color = bad ? THEME.danger : p.kind === 'shield' ? THEME.aimShield : THEME.action;

  g.setLineDash([5, 4]);
  g.strokeStyle = color;
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(p.x, p.y, r + 3, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);

  if (bad) {
    // « ! » sur le chat visé tel qu'il est maintenant ; le cercle fantôme montre où il sera touché.
    if (target) bang(g, target.x, target.y - r - 12);
    else bang(g, p.x, p.y - r - 14);
    if (p.kind === 'catch') arrow(g, p.x, p.y, p.dirX, p.dirY, r, color);
    // Flèche barrée : départ annulé.
    g.strokeStyle = THEME.danger;
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(p.x - 9, p.y - 9);
    g.lineTo(p.x + 9, p.y + 9);
    g.moveTo(p.x + 9, p.y - 9);
    g.lineTo(p.x - 9, p.y + 9);
    g.stroke();
  } else if (p.kind === 'catch') {
    arrow(g, p.x, p.y, p.dirX, p.dirY, r, color);
  }
}

function arrow(g: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, r: number, color: string): void {
  const x0 = x + dx * (r + 2), y0 = y + dy * (r + 2);
  const x1 = x + dx * (r + 30), y1 = y + dy * (r + 30);
  const a = Math.atan2(dy, dx);
  const head = (): void => {
    g.beginPath();
    g.moveTo(x1 + Math.cos(a) * 9, y1 + Math.sin(a) * 9);
    g.lineTo(x1 + Math.cos(a + 2.3) * 9, y1 + Math.sin(a + 2.3) * 9);
    g.lineTo(x1 + Math.cos(a - 2.3) * 9, y1 + Math.sin(a - 2.3) * 9);
    g.closePath();
  };
  g.lineCap = 'round';
  g.lineJoin = 'round';
  // Contour clair puis trait : lisible sur le ciel comme sur un sprite.
  for (const [stroke, w] of [[THEME.paper, 8], [color, 4]] as const) {
    g.strokeStyle = stroke;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    head();
    g.stroke();
  }
  g.fillStyle = color;
  head();
  g.fill();
}

function bang(g: CanvasRenderingContext2D, x: number, y: number): void {
  g.fillStyle = THEME.danger;
  g.beginPath();
  g.arc(x, y, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = THEME.paper;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `800 14px ${THEME.fontDisplay}`;
  g.fillText('!', x, y + 1);
}

// ── Lanceur ──────────────────────────────────────────────────────────────────

function drawLauncher(g: CanvasRenderingContext2D, r: RenderInput): void {
  const { sim } = r;
  const x = LAUNCH_X, y = LAUNCH_Y;
  g.fillStyle = THEME.launcher;
  g.strokeStyle = THEME.launcherRim;
  g.lineWidth = 2.5;
  g.beginPath();
  g.ellipse(x, y + 10, 26, 12, 0, 0, Math.PI);
  g.lineTo(x - 26, y + 4);
  g.ellipse(x, y + 4, 26, 7, 0, Math.PI, 0);
  g.closePath();
  g.fill();
  g.stroke();

  const ready = sim.pelotes > 0;
  if (ready) drawPelote(g, r.assets, x, y - 6, sim.cooldown > 0 ? 18 : 24, 0);

  const ringR = 30;
  g.lineWidth = 4;
  g.strokeStyle = THEME.progressTrack;
  g.beginPath();
  g.arc(x, y - 4, ringR, 0, Math.PI * 2);
  g.stroke();
  if (r.blink) {
    g.strokeStyle = THEME.blink;
    g.lineWidth = 5;
    g.beginPath();
    g.arc(x, y - 4, ringR, 0, Math.PI * 2);
    g.stroke();
  } else if (sim.cooldown > 0 && ready) {
    const k = 1 - sim.cooldown / COOLDOWN_TICKS;
    g.strokeStyle = THEME.action;
    g.beginPath();
    g.arc(x, y - 4, ringR, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
    g.stroke();
  }
}
