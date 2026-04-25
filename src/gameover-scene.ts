// Scène d'arrière-plan de l'overlay Game Over.
// Pluie de chats + floaters (étoiles, sparkles, cœurs) sur fond transparent
// pour rester par-dessus le backdrop violet de l'overlay et motiver le joueur.
import { CAT_SPRITES } from './sprites';

const canvas = document.getElementById('gameover-canvas') as HTMLCanvasElement | null;
if (!canvas) throw new Error('gameover-canvas missing');
const ctx = canvas.getContext('2d')!;

let W = 0, H = 0;
let lastTime = 0;
let running = false;
let rafId: number | null = null;

const CAT_POOL = Object.keys(CAT_SPRITES).filter(id => id !== 'boss' && id !== 'faux');

interface FCat {
  x: number; y: number; vx: number; vy: number;
  size: number; spriteId: string; poseIdx: number;
  rot: number; rotSpd: number; flip: boolean; alpha: number;
}

interface Floater {
  x: number; y: number; sz: number; vy: number; drift: number;
  rot: number; rotSpd: number; alpha: number; col: string;
  shape: 'star' | 'sparkle' | 'heart';
}

const FLOATER_COLS = ['#ffd6f2', '#fff7c0', '#ffffff', '#e8d5ff', '#ffe1c0', '#c8eaff'];
const HEART_COLS   = ['#ff8aba', '#ffb3d9', '#ff6b9e', '#ffa3c4'];
const FLOATER_SHAPES: Array<'star' | 'sparkle' | 'heart'> = ['star', 'star', 'sparkle', 'heart'];

const cats: FCat[] = [];
const floaters: Floater[] = [];

function resize(): void {
  W = canvas!.width = window.innerWidth;
  H = canvas!.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function spawnFloater(initial = false): void {
  const shape = FLOATER_SHAPES[Math.floor(Math.random() * FLOATER_SHAPES.length)];
  floaters.push({
    x: Math.random() * W,
    y: initial ? Math.random() * H : -10,
    sz: 5 + Math.random() * 8,
    vy: 0.22 + Math.random() * 0.4,
    drift: (Math.random() - 0.5) * 0.22,
    rot: Math.random() * Math.PI * 2,
    rotSpd: (Math.random() - 0.5) * 0.03,
    alpha: 0.5 + Math.random() * 0.4,
    col: shape === 'heart'
      ? HEART_COLS[Math.floor(Math.random() * HEART_COLS.length)]
      : FLOATER_COLS[Math.floor(Math.random() * FLOATER_COLS.length)],
    shape,
  });
}

function spawnCat(initial = false): void {
  if (CAT_POOL.length === 0) return;
  const id = CAT_POOL[Math.floor(Math.random() * CAT_POOL.length)];
  const sprites = CAT_SPRITES[id];
  if (!sprites || sprites.length === 0) return;
  const size = 22 + Math.random() * 28;
  cats.push({
    x: Math.random() * W,
    y: initial ? Math.random() * H * 0.5 : -size * 3,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 0.6 + Math.random() * 1.4,
    size,
    spriteId: id,
    poseIdx: Math.floor(Math.random() * sprites.length),
    rot: (Math.random() - 0.5) * 0.5,
    rotSpd: (Math.random() - 0.5) * 0.018,
    flip: Math.random() < 0.5,
    alpha: 0.55 + Math.random() * 0.4,
  });
}

function drawFloater(f: Floater): void {
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
  }
  ctx.restore();
}

function loop(ts: number): void {
  if (!running) { rafId = null; return; }
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  ctx.clearRect(0, 0, W, H);

  // Floaters
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.x += f.drift * dt * 60;
    f.y += f.vy * dt * 60;
    f.rot += f.rotSpd * dt * 60;
    if (f.y > H + f.sz * 2) { floaters.splice(i, 1); continue; }
    drawFloater(f);
  }
  if (floaters.length < 18 && Math.random() < 0.12) spawnFloater();

  // Chats
  for (let i = cats.length - 1; i >= 0; i--) {
    const c = cats[i];
    c.x += c.vx * dt * 60;
    c.y += c.vy * dt * 60;
    c.rot += c.rotSpd * dt * 60;
    if (c.y > H + c.size * 4) { cats.splice(i, 1); continue; }
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
  if (cats.length < 6 && Math.random() < 0.025) spawnCat();

  rafId = requestAnimationFrame(loop);
}

export function startGameoverScene(): void {
  if (running) return;
  resize();
  cats.length = 0;
  floaters.length = 0;
  for (let i = 0; i < 10; i++) spawnFloater(true);
  for (let i = 0; i < 3; i++) spawnCat(true);
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

export function stopGameoverScene(): void {
  running = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  ctx.clearRect(0, 0, W, H);
}
