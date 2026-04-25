// @ts-nocheck
import { state, clouds, bgFloaters } from './state';
import { ctx } from './canvas';
import { HUD_H, FLOATER_COLS, HEART_COLS, FLOATER_SHAPES } from './config';
import { BG_SPRITES, MOON_SPRITE } from './sprites';

// ── Clouds ────────────────────────────────────────────────────────────────────
for(let i=0;i<7;i++) clouds.push({x:Math.random()*window.innerWidth,y:80+Math.random()*200,r:28+Math.random()*50,spd:.18+Math.random()*.28,a:.45+Math.random()*.4});


// ── BG Floaters (parallax lent, dérive de haut en bas) ───────────────────────
for (let i = 0; i < 9; i++) {
  const shape = FLOATER_SHAPES[Math.floor(Math.random() * FLOATER_SHAPES.length)];
  bgFloaters.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
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
export function drawFloaters() {
  for (const f of bgFloaters) {
    f.x += f.drift; f.y += f.vy; f.rot += f.rotSpd;
    if (f.y > state.H + f.sz * 2) { f.y = -f.sz * 2; f.x = Math.random() * state.W; }
    if (f.x < -f.sz * 3) f.x = state.W + f.sz;
    if (f.x > state.W + f.sz * 3) f.x = -f.sz;
    ctx.save();
    ctx.globalAlpha = f.alpha;
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    if (f.shape === 'star') {
      ctx.fillStyle = f.col;
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
      ctx.fillStyle = f.col;
      ctx.beginPath();
      ctx.moveTo(0, -f.sz);
      ctx.quadraticCurveTo(f.sz*0.18, 0, f.sz, 0);
      ctx.quadraticCurveTo(f.sz*0.18, 0, 0, f.sz);
      ctx.quadraticCurveTo(-f.sz*0.18, 0, -f.sz, 0);
      ctx.quadraticCurveTo(-f.sz*0.18, 0, 0, -f.sz);
      ctx.closePath(); ctx.fill();
    } else if (f.shape === 'heart') {
      const r = f.sz;
      ctx.fillStyle = f.col;
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
export function drawBackground() {
  const isNight = state.activeEvent && state.activeEvent.id === 'nuit';
  const g = ctx.createLinearGradient(0, 0, 0, state.H);
  if (isNight) {
    // Ciel nocturne — gris très foncé / noir bleuté
    g.addColorStop(0,    '#0a0a18');
    g.addColorStop(0.55, '#15172a');
    g.addColorStop(1,    '#22243d');
  } else {
    // Candy Pop sky — #7ad7ff → #b8e9ff → #ffd6f2
    g.addColorStop(0,    '#7ad7ff');
    g.addColorStop(0.55, '#b8e9ff');
    g.addColorStop(1,    '#ffd6f2');
  }
  ctx.fillStyle = g; ctx.fillRect(0, 0, state.W, state.H);

  // Soleil/Lune parallax — slide lentement derrière les nuages, wrap autour de l'écran
  const celestR = 36;
  const margin = celestR * 2;
  const cycleW = state.W + margin * 2;
  const totalDist = state.gameTime * 12;
  const lapIdx = Math.floor(totalDist / cycleW);
  const celestX = (totalDist % cycleW) - margin;
  // Y varie à chaque tour : hash déterministe du n° de lap → offset entre -30 et +60 px
  const lapHash = Math.abs(Math.sin(lapIdx * 12.9898 + 78.233)) % 1;
  const baseY = HUD_H + 50 + lapHash * 90;
  const celestY = baseY + Math.sin(state.gameTime * 0.4) * 5;
  if (isNight && typeof MOON_SPRITE !== 'undefined' && MOON_SPRITE.complete && MOON_SPRITE.naturalWidth > 0) {
    // Halo bleuté autour de la lune
    const haloR = celestR * 1.7;
    const moonHalo = ctx.createRadialGradient(celestX, celestY, celestR * .3, celestX, celestY, haloR);
    moonHalo.addColorStop(0, 'rgba(220,235,255,0.55)');
    moonHalo.addColorStop(1, 'rgba(220,235,255,0)');
    ctx.fillStyle = moonHalo;
    ctx.beginPath(); ctx.arc(celestX, celestY, haloR, 0, Math.PI * 2); ctx.fill();
    const sz = celestR * 2.4;
    ctx.drawImage(MOON_SPRITE, celestX - sz/2, celestY - sz/2, sz, sz);
  } else {
    const sunGrad = ctx.createRadialGradient(celestX - celestR*.3, celestY - celestR*.3, celestR*.1, celestX, celestY, celestR * 1.3);
    sunGrad.addColorStop(0, '#fffde0');
    sunGrad.addColorStop(0.5, '#ffce3a');
    sunGrad.addColorStop(1, 'rgba(255,206,58,0)');
    ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(celestX, celestY, celestR * 1.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff7c0'; ctx.beginPath(); ctx.arc(celestX, celestY, celestR * 0.7, 0, Math.PI*2); ctx.fill();
  }

  // Floaters parallax (étoiles/sparkles dérivant lentement vers le bas)
  drawFloaters();

  // Anime clouds — pure white, rounded pillowy shapes
  for (const c of clouds) {
    c.x += c.spd; if (c.x > state.W + c.r * 4) c.x = -c.r * 4;
    ctx.save(); ctx.globalAlpha = 0.96;
    ctx.fillStyle = '#ffffff';
    // Main puffs (no shadow, no gradient — just clean flat white)
    ctx.beginPath(); ctx.arc(c.x,          c.y,          c.r,       0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x + c.r*.8, c.y + c.r*.1, c.r*.85,   0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x - c.r*.7, c.y + c.r*.1, c.r*.75,   0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x + c.r*.28,c.y - c.r*.4, c.r*.6,    0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x - c.r*.2, c.y - c.r*.3, c.r*.5,    0, Math.PI*2); ctx.fill();
    // Flat base to seal the bottom
    ctx.fillRect(c.x - c.r * 1.45, c.y + c.r*.12, c.r * 2.9, c.r * .62);
    // Tiny blush on the biggest puff — anime style
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffb8d8';
    ctx.beginPath(); ctx.ellipse(c.x - c.r*.42, c.y + c.r*.28, c.r*.22, c.r*.1, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x + c.r*.42, c.y + c.r*.28, c.r*.22, c.r*.1, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  drawScenery();
}


// ── Scenery (tileable AI backgrounds) ────────────────────────────────────────
/* extracted to module */
/* extracted to module */
// FLOATER_SPRITES removed (paw/yarn unused)



export function drawScenery() {
  const sprite = BG_SPRITES[state.currentScene];
  if (!sprite || !sprite.complete || !sprite.naturalWidth) return;
  const dispH = state.DECOR_H;
  const dispW = sprite.naturalWidth * dispH / sprite.naturalHeight;
  const baseY = state.H - dispH;
  let i = 0;
  for (let x = 0; x < state.W + dispW; x += dispW, i++) {
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

