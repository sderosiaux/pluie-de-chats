import { state } from './state';
import { ctx } from './canvas';
import { PROJ_DEFS } from './data';
import { WEAPON_SPRITES } from './sprites';
import type { Projectile, Effect } from './types';

// ── Projectile drawing ────────────────────────────────────────────────────────
export function drawProjectileShape(p: Projectile): void {
  const def = (PROJ_DEFS as any)[p.type];
  ctx.save();
  ctx.translate(p.x, p.y);

  // Trail
  if (p.trail && p.trail.length > 1) {
    for (let i = 1; i < p.trail.length; i++) {
      const t = i / p.trail.length;
      ctx.globalAlpha = t * 0.45;
      ctx.strokeStyle = def.col;
      ctx.lineWidth = p.r * 2 * t;
      ctx.lineCap = 'round';
      if (i === 1) { ctx.beginPath(); ctx.moveTo(p.trail[i-1].x - p.x, p.trail[i-1].y - p.y); }
      ctx.lineTo(p.trail[i].x - p.x, p.trail[i].y - p.y);
      if (i === p.trail.length - 1) ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Sprite override
  const _wSpr = typeof WEAPON_SPRITES !== 'undefined' && WEAPON_SPRITES[p.type];
  if (_wSpr && _wSpr.complete && _wSpr.naturalWidth > 0) {
    ctx.save();
    if (p.type === 'artifice') {
      ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
    } else {
      ctx.rotate(p.rot || 0);
    }
    const d = p.r * 3.2;
    ctx.drawImage(_wSpr, -d / 2, -d / 2, d, d);
    ctx.restore();
    ctx.restore();
    return;
  }

  ctx.rotate(p.rot || 0);

  switch (p.type) {
    case 'pelote': {
      // Red yarn ball
      ctx.fillStyle = def.col;
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 1.5;
      for (let i=0;i<3;i++){
        const a = i*Math.PI/1.5 + (p.rot||0)*2;
        ctx.beginPath();
        ctx.arc(0,0,p.r*.7,a,a+Math.PI*.9);
        ctx.stroke();
      }
      ctx.strokeStyle='rgba(255,180,180,0.6)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(0,0,p.r*.4,0,Math.PI*2); ctx.stroke();
      break;
    }
    case 'artifice': {
      // Star/firework shell with fuse
      const pulse = 0.85 + Math.sin(state.gameTime*12)*.15;
      ctx.fillStyle = def.col;
      ctx.beginPath(); ctx.arc(0,0,p.r*pulse,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#F1C40F';
      for (let i=0;i<6;i++){
        const a=i/6*Math.PI*2+(p.rot||0);
        ctx.beginPath(); ctx.arc(Math.cos(a)*p.r*1.4,Math.sin(a)*p.r*1.4,p.r*.3,0,Math.PI*2); ctx.fill();
      }
      // fuse spark
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.arc(Math.cos(p.fuseAngle||Math.PI)*p.r*1.1, Math.sin(p.fuseAngle||Math.PI)*p.r*1.1, p.r*.2,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'laser': {
      ctx.fillStyle = '#FF1744';
      ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case 'carton': {
      const sz = p.r * 1.6;
      ctx.fillStyle = '#D4A017';
      ctx.fillRect(-sz, -sz*.8, sz*2, sz*1.6);
      ctx.strokeStyle = '#A0780F'; ctx.lineWidth = 2;
      ctx.strokeRect(-sz, -sz*.8, sz*2, sz*1.6);
      ctx.beginPath(); ctx.moveTo(-sz, 0); ctx.lineTo(sz, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -sz*.8); ctx.lineTo(0, 0); ctx.stroke();
      break;
    }
  }
  ctx.restore();
}


// ── Lives display ─────────────────────────────────────────────────────────────
export function drawLives(): void {
  const heartSize = Math.round(Math.min(state.W * 0.048, 20));
  const gap = heartSize * 1.28;
  const totalW = state.MAX_LIVES * gap;
  const startX = state.W/2 - totalW/2 + gap/2;
  const lifeY = state.H - state.INV_H - heartSize/2 - 5;
  ctx.font = `${heartSize}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < state.MAX_LIVES; i++) {
    ctx.globalAlpha = i < state.lives ? 1 : 0.22;
    ctx.shadowColor = i < state.lives ? '#ff3ea5' : 'transparent';
    ctx.shadowBlur = i < state.lives ? 6 : 0;
    ctx.fillText(i < state.lives ? '❤️' : '🖤', startX + i * gap, lifeY);
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}


// ── Effects drawing ───────────────────────────────────────────────────────────
export function drawEffect(e: Effect): void {
  switch (e.type) {
    case 'explosion': {
      const prog = 1 - e.life;
      const r = (e.maxR || 0) * (0.3 + prog * 0.7);
      const ex = e.x || 0, ey = e.y || 0;
      // outer ring
      ctx.globalAlpha = e.life * 0.7;
      ctx.strokeStyle = '#F1C40F'; ctx.lineWidth = 6 * e.life;
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI*2); ctx.stroke();
      // inner glow
      const g = ctx.createRadialGradient(ex,ey,0,ex,ey,r*.8);
      g.addColorStop(0,`rgba(255,200,0,${e.life*.4})`);
      g.addColorStop(1,'rgba(255,100,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex,ey,r*.8,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'active_laser': {
      ctx.save();
      const lScale = state.laserHitWidth / 6;
      const x1 = e.x1 || 0, y1 = e.y1 || 0, x2 = e.x2 || 0, y2 = e.y2 || 0;
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const age = e.age || 0;

      // Flash d'amorce sur les 100 premières ms, puis pulse régulier
      const ignite = age < 0.1 ? 1 - age / 0.1 : 0;
      const pulse = 0.85 + 0.15 * Math.sin(age * 28);
      const fade = e.life > 0.4 ? 1 : e.life / 0.4;
      const intensity = fade * pulse;

      ctx.lineCap = 'round';

      // Halo glow externe — fin et propre, pas de gros cône
      ctx.strokeStyle = `rgba(255,40,80,${0.18 * intensity})`;
      ctx.lineWidth = (8 + 4 * ignite) * lScale;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // Core rouge vif
      ctx.strokeStyle = `rgba(255,30,80,${intensity})`;
      ctx.lineWidth = 3.2 * lScale;
      ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 14 * lScale;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // Cœur blanc incandescent
      ctx.strokeStyle = `rgba(255,255,255,${intensity})`;
      ctx.lineWidth = 1.2 * lScale;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // Burst à l'origine (canon) — radial gradient pulsé
      const burstR = (16 + 10 * ignite) * lScale * pulse;
      const og = ctx.createRadialGradient(x1, y1, 0, x1, y1, burstR);
      og.addColorStop(0, `rgba(255,255,255,${0.95 * intensity})`);
      og.addColorStop(0.35, `rgba(255,80,100,${0.6 * intensity})`);
      og.addColorStop(1, 'rgba(255,30,60,0)');
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.arc(x1, y1, burstR, 0, Math.PI * 2); ctx.fill();

      // Burst d'impact (au bout du rayon)
      const hitR = (12 + 8 * ignite) * lScale * pulse;
      const hg = ctx.createRadialGradient(x2, y2, 0, x2, y2, hitR);
      hg.addColorStop(0, `rgba(255,255,255,${intensity})`);
      hg.addColorStop(0.4, `rgba(255,100,120,${0.55 * intensity})`);
      hg.addColorStop(1, 'rgba(255,30,60,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(x2, y2, hitR, 0, Math.PI * 2); ctx.fill();

      // Particules d'énergie qui descendent le rayon (3 dots qui glissent)
      const NDOTS = 3;
      for (let i = 0; i < NDOTS; i++) {
        const t = ((age * 1.6 + i / NDOTS) % 1);
        const px = x1 + ux * len * t;
        const py = y1 + uy * len * t;
        const dotR = 3.2 * lScale * (1 - Math.abs(0.5 - t) * 0.6);
        ctx.fillStyle = `rgba(255,255,255,${0.9 * intensity})`;
        ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 10 * lScale;
        ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;

      ctx.restore();
      break;
    }
    case 'levelup': {
      const prog = Math.min(1, e.age / 0.25); // pop-in rapide
      const scale = prog < 0.5 ? prog/0.5 * 1.15 : 1.15 - (prog-0.5)/0.5 * 0.15;
      ctx.save();
      ctx.globalAlpha = e.life * (prog < 0.1 ? prog/0.1 : 1);
      ctx.translate(state.W/2, state.H/2 - 50);
      ctx.scale(scale, scale);
      // halo
      const halo = ctx.createRadialGradient(0,0,0,0,0,220);
      halo.addColorStop(0,`rgba(255,215,0,${e.life*.35})`);
      halo.addColorStop(1,'rgba(255,215,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0,0,220,0,Math.PI*2); ctx.fill();
      // texte principal
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 52px "Arial Rounded MT Bold", Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`⭐ NIVEAU ${e.level} !`, 0, 0);
      // bonus
      if (e.desc) {
        ctx.font = 'bold 21px "Arial Rounded MT Bold", Arial';
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 6;
        ctx.fillText(e.desc, 0, 52);
      }
      ctx.restore();
      break;
    }
    case 'hit_flash': {
      ctx.save();
      ctx.globalAlpha = e.life * 0.38;
      ctx.fillStyle = '#FF1744';
      ctx.fillRect(0, 0, state.W, state.H);
      ctx.restore();
      break;
    }
    case 'enemyBullet': {
      const ex = e.x || 0, ey = e.y || 0;
      // Trail
      ctx.save();
      ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FF1744';
      ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'carton_box': {
      const sz = 48 + (1-e.life)*10;
      const ex = e.x || 0, ey = e.y || 0, er = e.r || 0;
      // attraction field
      const g2 = ctx.createRadialGradient(ex,ey,sz,ex,ey,er);
      g2.addColorStop(0,`rgba(212,160,23,${e.life*.25})`);
      g2.addColorStop(1,'rgba(212,160,23,0)');
      ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(ex,ey,er,0,Math.PI*2); ctx.fill();
      // sprite
      ctx.save();
      ctx.translate(ex, ey + Math.sin(state.gameTime*4)*3);
      const _cSpr = WEAPON_SPRITES['carton'];
      if (_cSpr && _cSpr.complete && _cSpr.naturalWidth > 0) {
        ctx.globalAlpha = e.life;
        ctx.drawImage(_cSpr, -sz, -sz, sz*2, sz*2);
      } else {
        ctx.fillStyle='#D4A017';
        ctx.fillRect(-sz*.7,-sz*.6,sz*1.4,sz*1.2);
      }
      ctx.restore();
      break;
    }
  }
}

