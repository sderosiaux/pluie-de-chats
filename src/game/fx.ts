// Effets purement visuels, en coordonnées monde. Ils avancent avec l'horloge d'affichage
// (ralenti et accéléré compris) et ne lisent ni n'écrivent jamais la simulation.

import { THEME } from './look';

// Bandeau de caractère au-dessus du lanceur : en haut, il masquerait le chat qu'il présente.
const BANNER_Y = 528;

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface FloatText { x: number; y: number; vy: number; text: string; life: number; max: number; size: number; color: string; weight: number }
interface Spark { x: number; y: number; life: number; max: number }
interface Stamp { n: number; points: number; life: number; max: number }
interface Banner { icon: string; label: string; rule: string; life: number; max: number }

export interface Fx {
  particles: Particle[];
  texts: FloatText[];
  sparks: Spark[];
  stamp: Stamp | null;
  banners: Banner[]; // file : seul le premier s'affiche
  shake: number; // amplitude courante (px monde)
  shakeX: number;
  shakeY: number;
}

export function createFx(): Fx {
  return { particles: [], texts: [], sparks: [], stamp: null, banners: [], shake: 0, shakeX: 0, shakeY: 0 };
}

export function burst(fx: Fx, x: number, y: number, count: number, colors: readonly string[]): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 140;
    const max = 0.35 + Math.random() * 0.3;
    fx.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: max, max,
      color: colors[i % colors.length], size: 2.5 + Math.random() * 3,
    });
  }
}

export function floatText(fx: Fx, x: number, y: number, text: string, opts: { size?: number; color?: string; weight?: number; life?: number; vy?: number } = {}): void {
  const max = opts.life ?? 0.9;
  fx.texts.push({ x, y, vy: opts.vy ?? -38, text, life: max, max, size: opts.size ?? 16, color: opts.color ?? THEME.ink, weight: opts.weight ?? 800 });
}

export function spark(fx: Fx, x: number, y: number): void {
  fx.sparks.push({ x, y, life: 0.3, max: 0.3 });
}

export function stamp(fx: Fx, n: number, points: number): void {
  fx.stamp = { n, points, life: 1.4, max: 1.4 };
}

export function shake(fx: Fx, amp: number): void {
  fx.shake = Math.max(fx.shake, amp);
}

export function queueBanner(fx: Fx, icon: string, label: string, rule: string): void {
  fx.banners.push({ icon, label, rule, life: 2, max: 2 });
}

/** `realDt` : temps réel écoulé. Le bandeau de caractère dure 2 s RÉELLES, même en accéléré ou au ralenti (§13). */
export function updateFx(fx: Fx, dt: number, realDt: number = dt): void {
  for (const p of fx.particles) {
    p.life -= dt;
    p.vy += 320 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  fx.particles = fx.particles.filter(p => p.life > 0);
  for (const t of fx.texts) {
    t.life -= dt;
    t.y += t.vy * dt;
  }
  fx.texts = fx.texts.filter(t => t.life > 0);
  for (const s of fx.sparks) s.life -= dt;
  fx.sparks = fx.sparks.filter(s => s.life > 0);
  if (fx.stamp) {
    fx.stamp.life -= dt;
    if (fx.stamp.life <= 0) fx.stamp = null;
  }
  const b = fx.banners[0];
  if (b) {
    b.life -= realDt;
    if (b.life <= 0) fx.banners.shift();
  }
  fx.shake = Math.max(0, fx.shake - dt * 30);
  fx.shakeX = (Math.random() * 2 - 1) * fx.shake;
  fx.shakeY = (Math.random() * 2 - 1) * fx.shake;
}

// ── Dessin (le contexte est déjà en coordonnées monde) ───────────────────────

export function drawWorldFx(g: CanvasRenderingContext2D, fx: Fx): void {
  for (const p of fx.particles) {
    g.globalAlpha = Math.max(0, p.life / p.max);
    g.fillStyle = p.color;
    g.beginPath();
    g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  for (const s of fx.sparks) {
    const k = 1 - s.life / s.max;
    g.strokeStyle = THEME.spark;
    g.lineWidth = 3;
    g.globalAlpha = 1 - k;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r0 = 6 + k * 10, r1 = 12 + k * 22;
      g.beginPath();
      g.moveTo(s.x + Math.cos(a) * r0, s.y + Math.sin(a) * r0);
      g.lineTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const t of fx.texts) {
    const k = t.life / t.max;
    g.globalAlpha = Math.min(1, k * 2.5);
    g.font = `${t.weight} ${t.size}px ${THEME.fontDisplay}`;
    g.lineJoin = 'round';
    g.lineWidth = Math.max(3, t.size * 0.22);
    g.strokeStyle = THEME.paper;
    g.strokeText(t.text, t.x, t.y);
    g.fillStyle = t.color;
    g.fillText(t.text, t.x, t.y);
  }
  g.globalAlpha = 1;
}

/** Tampon « Carambolage ×n » centré, et bandeau de caractère. */
export function drawOverlayFx(g: CanvasRenderingContext2D, fx: Fx, cx: number, cy: number): void {
  const st = fx.stamp;
  if (st) {
    const age = st.max - st.life;
    const pop = age < 0.14 ? 1.5 - (age / 0.14) * 0.5 : 1;
    const alpha = Math.min(1, st.life / 0.3);
    const size = Math.min(46, 30 + st.n * 1.5);
    g.save();
    g.translate(cx, cy);
    g.rotate(-0.1);
    g.scale(pop, pop);
    g.globalAlpha = alpha;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.font = `800 ${size}px ${THEME.fontDisplay}`;
    g.lineWidth = 9;
    g.strokeStyle = THEME.paper;
    g.strokeText(`Carambolage ×${st.n}`, 0, 0);
    g.fillStyle = THEME.action;
    g.fillText(`Carambolage ×${st.n}`, 0, 0);
    g.font = `700 20px ${THEME.fontDisplay}`;
    g.lineWidth = 6;
    g.strokeText(`+${st.points}`, 0, size * 0.85);
    g.fillStyle = THEME.ink;
    g.fillText(`+${st.points}`, 0, size * 0.85);
    g.restore();
  }

  const b = fx.banners[0];
  if (b) {
    const age = b.max - b.life;
    const a = Math.min(1, age / 0.2, b.life / 0.25);
    const y = BANNER_Y + (1 - a) * 10;
    g.save();
    g.globalAlpha = a * 0.94;
    g.fillStyle = THEME.paper;
    g.strokeStyle = THEME.inkFaint;
    g.lineWidth = 1.5;
    roundRect(g, 40, y, 280, 30, 15);
    g.fill();
    g.stroke();
    g.globalAlpha = a;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.font = `16px ${THEME.fontText}`;
    g.fillText(b.icon, 52, y + 16);
    g.fillStyle = THEME.ink;
    g.font = `800 15px ${THEME.fontDisplay}`;
    g.fillText(b.label, 76, y + 16);
    const lw = g.measureText(b.label).width;
    g.font = `500 13px ${THEME.fontText}`;
    g.fillStyle = THEME.inkSoft;
    g.fillText(b.rule ? `— ${b.rule}` : '', 82 + lw, y + 16);
    g.restore();
  }
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
