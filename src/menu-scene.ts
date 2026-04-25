// Scène animée du menu de démarrage.
// Reprend l'ambiance du jeu (ciel + soleil parallax + nuages + chats sprites)
// sans gameplay, weapons ou interaction.
import { CAT_SPRITES, BG_SPRITES } from './sprites';

const SCENE_IDS = ['city', 'garden', 'home', 'forest'];
const sceneId = SCENE_IDS[Math.floor(Math.random() * SCENE_IDS.length)];

const canvas = document.getElementById('menu-canvas') as HTMLCanvasElement | null;
if (!canvas) throw new Error('menu-canvas missing');
const ctx = canvas.getContext('2d')!;

let W = 0, H = 0;
let lastTime = 0;
let running = false;
let rafId: number | null = null;

// Catalogue des chats utilisables (subset visuel sympa, exclut le boss et les pures objets)
const CAT_POOL = Object.keys(CAT_SPRITES).filter(id => id !== 'boss' && id !== 'faux');

interface Cloud {
  x: number; y: number; r: number; spd: number;
}

interface MenuCat {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  spriteId: string;
  poseIdx: number;
  rot: number;
  rotSpd: number;
  flip: boolean;
  alpha: number;
}

interface Floater {
  x: number; y: number;
  sz: number; vy: number; drift: number;
  rot: number; rotSpd: number;
  alpha: number; col: string;
  shape: 'star' | 'sparkle' | 'heart';
}

const FLOATER_COLS = ['#ffd6f2', '#fff7c0', '#ffffff', '#e8d5ff', '#ffe1c0', '#c8eaff'];
const HEART_COLS   = ['#ff8aba', '#ffb3d9', '#ff6b9e', '#ffa3c4'];
const FLOATER_SHAPES: Array<'star' | 'sparkle' | 'heart'> = ['star', 'star', 'sparkle', 'heart'];

const clouds: Cloud[] = [];
const cats: MenuCat[] = [];
const floaters: Floater[] = [];

function spawnFloater(initial = false): void {
  const shape = FLOATER_SHAPES[Math.floor(Math.random() * FLOATER_SHAPES.length)];
  floaters.push({
    x: Math.random() * window.innerWidth,
    y: initial ? Math.random() * window.innerHeight : -10,
    sz: 5 + Math.random() * 7,
    vy: 0.18 + Math.random() * 0.32,
    drift: (Math.random() - 0.5) * 0.18,
    rot: Math.random() * Math.PI * 2,
    rotSpd: (Math.random() - 0.5) * 0.025,
    alpha: 0.45 + Math.random() * 0.35,
    col: shape === 'heart'
      ? HEART_COLS[Math.floor(Math.random() * HEART_COLS.length)]
      : FLOATER_COLS[Math.floor(Math.random() * FLOATER_COLS.length)],
    shape,
  });
}

function resize(): void {
  W = canvas!.width = window.innerWidth;
  H = canvas!.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function spawnCloud(initial = false): void {
  const r = 28 + Math.random() * 50;
  clouds.push({
    x: initial ? Math.random() * W : -r * 4,
    y: 60 + Math.random() * (H * 0.45),
    r,
    spd: 0.18 + Math.random() * 0.28,
  });
}

function spawnCat(initial = false): void {
  if (CAT_POOL.length === 0) return;
  const id = CAT_POOL[Math.floor(Math.random() * CAT_POOL.length)];
  const sprites = CAT_SPRITES[id];
  if (!sprites || sprites.length === 0) return;
  const size = 18 + Math.random() * 24;
  cats.push({
    x: Math.random() * W,
    y: initial ? Math.random() * H * 0.7 : -size * 3,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.5 + Math.random() * 1.1,
    size,
    spriteId: id,
    poseIdx: Math.floor(Math.random() * sprites.length),
    rot: (Math.random() - 0.5) * 0.4,
    rotSpd: (Math.random() - 0.5) * 0.012,
    flip: Math.random() < 0.5,
    alpha: 0.55 + Math.random() * 0.4,
  });
}

// Init : pré-remplir avec quelques nuages, chats et floaters déjà à l'écran
for (let i = 0; i < 4; i++) spawnCloud(true);
for (let i = 0; i < 2; i++) spawnCat(true);
for (let i = 0; i < 8; i++) spawnFloater(true);

function drawSky(): void {
  // Gradient candy pop
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0,    '#7ad7ff');
  g.addColorStop(0.55, '#b8e9ff');
  g.addColorStop(1,    '#ffd6f2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawSun(time: number): void {
  // Parallax doux : le soleil traverse l'écran lentement, wrap-around
  const cycleW = W + 120;
  const sunX = ((time * 8) % cycleW) - 60;
  const sunY = 90 + Math.sin(time * 0.4) * 6;
  const r = 38;
  // Halo
  const halo = ctx.createRadialGradient(sunX - r*0.3, sunY - r*0.3, r*0.1, sunX, sunY, r*1.4);
  halo.addColorStop(0, '#fffde0');
  halo.addColorStop(0.5, '#ffce3a');
  halo.addColorStop(1, 'rgba(255,206,58,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(sunX, sunY, r * 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff7c0';
  ctx.beginPath(); ctx.arc(sunX, sunY, r * 0.7, 0, Math.PI * 2); ctx.fill();
}

function updateAndDrawClouds(dt: number): void {
  for (const c of clouds) {
    c.x += c.spd * dt * 60; // dt-normalisé (60fps de référence)
    if (c.x > W + c.r * 4) c.x = -c.r * 4;
  }
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#ffffff';
  for (const c of clouds) {
    // Cinq puffs collés pour faire un petit nuage chibi
    ctx.beginPath(); ctx.arc(c.x,           c.y,           c.r,         0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x + c.r*.8,  c.y + c.r*.1,  c.r*.85,     0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x - c.r*.7,  c.y + c.r*.1,  c.r*.75,     0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x + c.r*.28, c.y - c.r*.4,  c.r*.6,      0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x - c.r*.2,  c.y - c.r*.3,  c.r*.5,      0, Math.PI*2); ctx.fill();
    ctx.fillRect(c.x - c.r * 1.45, c.y + c.r*.12, c.r * 2.9, c.r * .62);
  }
  ctx.restore();
}

function updateAndDrawFloaters(dt: number): void {
  for (const f of floaters) {
    f.x += f.drift * dt * 60;
    f.y += f.vy * dt * 60;
    f.rot += f.rotSpd * dt * 60;
    if (f.y > H + f.sz * 2) { f.y = -f.sz * 2; f.x = Math.random() * W; }
    if (f.x < -f.sz * 3) f.x = W + f.sz;
    if (f.x > W + f.sz * 3) f.x = -f.sz;
    ctx.save();
    ctx.globalAlpha = f.alpha;
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.fillStyle = f.col;
    if (f.shape === 'star') {
      ctx.beginPath();
      const r = f.sz;
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.45;
        const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
    } else if (f.shape === 'sparkle') {
      ctx.beginPath();
      ctx.moveTo(0, -f.sz);
      ctx.quadraticCurveTo(f.sz*0.18, 0, f.sz, 0);
      ctx.quadraticCurveTo(f.sz*0.18, 0, 0, f.sz);
      ctx.quadraticCurveTo(-f.sz*0.18, 0, -f.sz, 0);
      ctx.quadraticCurveTo(-f.sz*0.18, 0, 0, -f.sz);
      ctx.closePath(); ctx.fill();
    } else {
      const r = f.sz;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.85);
      ctx.bezierCurveTo(r * 1.1, r * 0.2, r * 0.6, -r * 0.85, 0, -r * 0.25);
      ctx.bezierCurveTo(-r * 0.6, -r * 0.85, -r * 1.1, r * 0.2, 0, r * 0.85);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.32, -r * 0.32, r * 0.18, r * 0.1, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawScenery(): void {
  const sprite = BG_SPRITES[sceneId];
  if (!sprite || !sprite.complete || !sprite.naturalWidth) return;
  // Hauteur du décor proportionnelle à la fenêtre, mais plafonnée
  const dispH = Math.min(160, Math.max(110, Math.round(H * 0.18)));
  const dispW = sprite.naturalWidth * dispH / sprite.naturalHeight;
  const baseY = H - dispH;
  let i = 0;
  // Tile + flip alterné pour cacher les coutures
  for (let x = 0; x < W + dispW; x += dispW, i++) {
    ctx.save();
    if (i % 2 === 1) {
      ctx.translate(x + dispW, baseY);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, dispW, dispH);
    } else {
      ctx.drawImage(sprite, x, baseY, dispW, dispH);
    }
    ctx.restore();
  }
}

function updateAndDrawCats(dt: number): void {
  for (let i = cats.length - 1; i >= 0; i--) {
    const c = cats[i];
    c.x += c.vx * dt * 60;
    c.y += c.vy * dt * 60;
    c.rot += c.rotSpd * dt * 60;
    if (c.y > H + c.size * 4 || c.x < -c.size * 4 || c.x > W + c.size * 4) {
      cats.splice(i, 1);
      continue;
    }
    const sprites = CAT_SPRITES[c.spriteId];
    const img = sprites && sprites[c.poseIdx];
    if (!img || !img.complete || !img.naturalWidth) continue;
    const d = c.size * 2.6;
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    if (c.flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -d / 2, -d / 2, d, d);
    ctx.restore();
  }
  // Spawn très espacé : max 3 chats simultanés, ~1 spawn toutes les 6s
  if (cats.length < 3 && Math.random() < 0.003) spawnCat();
}

function loop(ts: number): void {
  if (!running) { rafId = null; return; }
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  const time = ts / 1000;

  drawSky();
  drawSun(time);
  updateAndDrawFloaters(dt);
  updateAndDrawClouds(dt);
  drawScenery();
  updateAndDrawCats(dt);

  rafId = requestAnimationFrame(loop);
}

export function startMenuScene(): void {
  if (running) return;
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

export function stopMenuScene(): void {
  running = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
