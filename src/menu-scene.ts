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

const clouds: Cloud[] = [];
const cats: MenuCat[] = [];

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

// Init : pré-remplir avec quelques nuages et chats déjà à l'écran (peu nombreux pour ne pas surcharger)
for (let i = 0; i < 5; i++) spawnCloud(true);
for (let i = 0; i < 3; i++) spawnCat(true);

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
  // Spawn doux : maintient ~3-5 chats à l'écran (peu, juste pour l'ambiance)
  if (cats.length < 4 && Math.random() < 0.006) spawnCat();
}

function loop(ts: number): void {
  if (!running) { rafId = null; return; }
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  const time = ts / 1000;

  drawSky();
  drawSun(time);
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
