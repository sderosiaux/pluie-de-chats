import { state, unlockedTypes, rechargeTimers } from './state';
import { ctx } from './canvas';
import { HUD_H, DIAL_R, DIAL_ANGLES, MAX_PULL, TYPE_ORDER } from './config';
import { PROJ_DEFS } from './data';
import { drawProjIcon } from './render-cats';
import { WEAPON_SPRITES } from './sprites';

// ── Trajectory preview ────────────────────────────────────────────────────────
export function drawTrajectory(): void {
  if (!state.isDragging || !state.dragPos) return;
  const def = (PROJ_DEFS as any)[state.selectedType];
  if (def.stock <= 0) return;

  const dx = state.dragPos.x - state.LAUNCHER.x, dy = state.dragPos.y - state.LAUNCHER.y;
  const dist = Math.hypot(dx,dy);
  if (dist < 8) return;

  const pull = Math.min(dist, MAX_PULL) / MAX_PULL;
  const nx = dx/dist, ny = dy/dist;
  const spd = def.speed[0] + pull * (def.speed[1] - def.speed[0]);
  let vx = nx*spd, vy = ny*spd;
  let x = state.LAUNCHER.x, y = state.LAUNCHER.y;
  const grav = state.selectedType === 'laser' ? 0 : def.gravity;

  // aim indicator
  ctx.save();
  const aimLen = Math.min(dist, MAX_PULL);
  const ax = state.LAUNCHER.x + nx * aimLen, ay = state.LAUNCHER.y + ny * aimLen;
  ctx.strokeStyle = def.col; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(state.LAUNCHER.x, state.LAUNCHER.y); ctx.lineTo(ax, ay); ctx.stroke();
  ctx.setLineDash([]);
  // arrowhead
  const angle = Math.atan2(ny, nx);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = def.col;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 12*Math.cos(angle-0.42), ay - 12*Math.sin(angle-0.42));
  ctx.lineTo(ax - 12*Math.cos(angle+0.42), ay - 12*Math.sin(angle+0.42));
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  // trajectory dots
  const steps = state.selectedType === 'laser' ? 2 : 65;
  for (let i=0;i<steps;i++) {
    x+=vx; y+=vy; vy+=grav;
    if (vx<0&&x<0||vx>0&&x>state.W) vx*=-1;
    if (y > state.H + 40 || y < HUD_H) break;
    if (i%4===0) {
      const alpha = 0.7 - (i/steps)*0.55;
      ctx.globalAlpha = Math.max(0.08, alpha);
      ctx.fillStyle = def.col;
      ctx.beginPath(); ctx.arc(x,y, 4-i/steps*2.5, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha=1;
  ctx.restore();
}


// ── Launcher visual ───────────────────────────────────────────────────────────
export function drawLauncher(): void {
  const lx = state.LAUNCHER.x, ly = state.LAUNCHER.y;
  ctx.save();

  // handle
  ctx.strokeStyle='#5D4037'; ctx.lineWidth=10; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(lx,ly+8); ctx.lineTo(lx,ly+38); ctx.stroke();
  // base
  ctx.fillStyle='#6D4C41';
  ctx.beginPath(); ctx.ellipse(lx,ly+42,22,8,0,0,Math.PI*2); ctx.fill();
  // fork arms
  ctx.strokeStyle='#4E342E'; ctx.lineWidth=8;
  ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx-14,ly-20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx+14,ly-20); ctx.stroke();
  // tips
  ctx.fillStyle='#3E2723';
  ctx.beginPath(); ctx.arc(lx-14,ly-22,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(lx+14,ly-22,5,0,Math.PI*2); ctx.fill();
  // elastic — Candy Pop magenta/pink
  ctx.strokeStyle='#ff3ea5'; ctx.lineWidth=2.5;
  ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(lx-14,ly-22); ctx.quadraticCurveTo(lx,ly-18,lx+14,ly-22); ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}


// ── Inventory — Candy Pop Dial Radial ─────────────────────────────────────────
export function drawPadlock(cx: number, cy: number, size: number): void {
  const bw = size * 1.05, bh = size * 0.78;
  const bx = cx - bw / 2, by = cy - bh * 0.1;
  const shackleR = bw * 0.28;
  const shimT = (state.gameTime * 0.55) % 1;

  ctx.save();
  // Shackle
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = size * 0.17; ctx.lineCap = 'round';
  ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(cx, by, shackleR, Math.PI, 0); ctx.stroke();
  ctx.shadowBlur = 0;

  // Body
  const bodyGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  bodyGrad.addColorStop(0, '#FFE55C'); bodyGrad.addColorStop(0.45, '#FFB300'); bodyGrad.addColorStop(1, '#9A5E00');
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 7;
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, size * 0.13); ctx.fill();
  ctx.shadowBlur = 0;

  // Keyhole
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.beginPath(); ctx.arc(cx, by + bh * 0.35, bw * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - bw * 0.065, by + bh * 0.35, bw * 0.13, bh * 0.31);

  // Shimmer sweep
  const shimX = bx - bw * 0.3 + shimT * bw * 1.8;
  const shimGrad = ctx.createLinearGradient(shimX - bw * 0.3, 0, shimX + bw * 0.3, 0);
  shimGrad.addColorStop(0, 'rgba(255,255,255,0)');
  shimGrad.addColorStop(0.5, 'rgba(255,255,255,0.44)');
  shimGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, size * 0.13); ctx.clip();
  ctx.fillStyle = shimGrad; ctx.fillRect(bx - bw, by, bw * 4, bh); ctx.restore();
  ctx.restore();
}

export function drawInventory(): void {
  const dcx = state.W / 2, dcy = state.DIAL_CY;

  for (let i = 0; i < TYPE_ORDER.length; i++) {
    const id = TYPE_ORDER[i];
    const def = PROJ_DEFS[id];
    const locked = !unlockedTypes.has(id);
    const isSelected = !locked && state.selectedType === id;
    const ang = DIAL_ANGLES[i] * Math.PI / 180;
    const sx = dcx + Math.cos(ang) * DIAL_R;
    const sy = dcy + Math.sin(ang) * DIAL_R;
    const slotR = isSelected ? 34 : 28;

    ctx.save();

    if (locked) {
      // Dark blurred background circle
      ctx.beginPath(); ctx.arc(sx, sy, slotR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20,10,45,0.75)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,206,58,0.45)'; ctx.lineWidth = 1.5;
      ctx.stroke();
      // Big shiny padlock centered in slot
      drawPadlock(sx, sy, slotR * 0.72);
      // Hint below
      ctx.font = `700 ${Math.round(slotR * 0.38)}px "Baloo 2",Arial`;
      ctx.fillStyle = '#ffce3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 3;
      ctx.fillText(def.unlockHint, sx, sy + slotR * 0.62);
      ctx.shadowBlur = 0;

    } else {
      const tone = def.col;
      const _wSpr = typeof WEAPON_SPRITES !== 'undefined' && WEAPON_SPRITES[id];
      const hasSprite = _wSpr && _wSpr.complete && _wSpr.naturalWidth > 0;

      // Selected: outer glow rings
      if (isSelected) {
        const pulse = (Math.sin(state.gameTime * 4.5) + 1) * 0.5;
        ctx.strokeStyle = tone + Math.round((pulse * 0.55 + 0.2) * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(sx, sy, slotR + 10, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffce3a'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(sx, sy, slotR + 3, 0, Math.PI * 2); ctx.stroke();
      }

      if (!hasSprite) {
        // Circle fill with radial gradient
        ctx.shadowColor = tone + (isSelected ? 'cc' : '55');
        ctx.shadowBlur = isSelected ? 20 : 10; ctx.shadowOffsetY = 4;
        const slotGrad = ctx.createRadialGradient(sx - slotR * .28, sy - slotR * .28, slotR * .04, sx, sy, slotR);
        slotGrad.addColorStop(0, tone + 'ff'); slotGrad.addColorStop(1, tone + 'a0');
        ctx.fillStyle = slotGrad;
        ctx.beginPath(); ctx.arc(sx, sy, slotR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        // Inner highlight
        const hl = ctx.createRadialGradient(sx - slotR * .3, sy - slotR * .38, 0, sx, sy, slotR);
        hl.addColorStop(0, 'rgba(255,255,255,0.50)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(sx, sy, slotR, 0, Math.PI * 2); ctx.fill();

        // Border
        ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.50)';
        ctx.lineWidth = isSelected ? 2.5 : 1.2;
        ctx.beginPath(); ctx.arc(sx, sy, slotR, 0, Math.PI * 2); ctx.stroke();
      } else {
        // Sticker button background — cream solide cohérent avec le style kawaii
        ctx.save();
        ctx.shadowColor = 'rgba(42,27,74,0.35)';
        ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#fff8e6';
        ctx.beginPath(); ctx.arc(sx, sy, slotR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Highlight haut-gauche
        const hl = ctx.createRadialGradient(sx - slotR * .35, sy - slotR * .4, 0, sx, sy, slotR);
        hl.addColorStop(0, 'rgba(255,255,255,0.55)'); hl.addColorStop(0.6, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(sx, sy, slotR, 0, Math.PI * 2); ctx.fill();
        // Bordure (couleur de l'arme si sélectionné, sinon discrète)
        ctx.strokeStyle = isSelected ? tone : 'rgba(42,27,74,0.25)';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath(); ctx.arc(sx, sy, slotR, 0, Math.PI * 2); ctx.stroke();
      }

      // Icon — tenir dans le sticker cream avec marge
      if (def.stock === 0) ctx.globalAlpha = 0.32;
      drawProjIcon(id, sx, sy, slotR * (hasSprite ? 0.85 : 0.78));
      ctx.globalAlpha = 1;

      // Cooldown pie overlay
      if (def.stock < def.maxStock && rechargeTimers[id] > 0) {
        const remaining = rechargeTimers[id] / def.recharge;
        ctx.save();
        ctx.beginPath(); ctx.arc(sx, sy, slotR - 1, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = 'rgba(20,10,50,0.72)';
        ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.arc(sx, sy, slotR, -Math.PI / 2, -Math.PI / 2 + remaining * Math.PI * 2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(-Math.PI / 2 + remaining * Math.PI * 2) * slotR,
                   sy + Math.sin(-Math.PI / 2 + remaining * Math.PI * 2) * slotR);
        ctx.stroke();
        ctx.restore();
        const secsLeft = Math.ceil(rechargeTimers[id]);
        ctx.font = `900 ${Math.round(slotR * 0.60)}px "Baloo 2",Arial`;
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 5;
        ctx.fillText(`${secsLeft}s`, sx, sy);
        ctx.shadowBlur = 0;
      }

      // Stock badge
      const bR = slotR * 0.36;
      const bX = sx + slotR * 0.72, bY = sy - slotR * 0.72;
      const isEmpty = def.stock === 0;
      ctx.fillStyle = isEmpty ? '#FF3333' : '#fff8e6';
      ctx.shadowColor = isEmpty ? '#FF333388' : 'rgba(42,27,74,0.2)'; ctx.shadowBlur = isEmpty ? 9 : 4;
      ctx.beginPath(); ctx.arc(bX, bY, bR + 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isEmpty ? '#fff' : '#2a1b4a'; ctx.lineWidth = isEmpty ? 1.5 : 1;
      ctx.beginPath(); ctx.arc(bX, bY, bR + 2, 0, Math.PI * 2); ctx.stroke();
      ctx.font = `900 ${Math.round(bR * 1.55)}px "Baloo 2",Arial`;
      ctx.fillStyle = isEmpty ? '#fff' : '#2a1b4a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(def.stock), bX, bY + 0.5);
    }

    ctx.restore();
  }

}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

