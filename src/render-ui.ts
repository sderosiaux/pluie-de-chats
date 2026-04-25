import { state, unlockedTypes, rechargeTimers } from './state';
import { ctx } from './canvas';
import { HUD_H, MAX_PULL, TYPE_ORDER, getSlotPos } from './config';
import { PROJ_DEFS } from './data';
import { drawProjIcon } from './render-cats';
import { WEAPON_SPRITES } from './sprites';

// ── Trajectory preview ────────────────────────────────────────────────────────
export function drawTrajectory(): void {
  if (!state.isDragging || !state.dragPos) return;
  const def = (PROJ_DEFS as any)[state.selectedType];
  if (def.stock <= 0) return;

  // Charge ring autour du launcher (hold-to-charge)
  if (state.selectedType !== 'laser' && state.chargeRatio > 0) {
    const lx = state.LAUNCHER.x, ly = state.LAUNCHER.y;
    const cr = state.chargeRatio;
    // Couleur orange → jaune → blanc à pleine charge
    const col = cr >= 1 ? '#fff8c0' : cr > 0.7 ? '#ffce3a' : '#ff8a48';
    const ringR = 28 + cr * 18;
    ctx.save();
    // Halo pulsant à 100%
    if (cr >= 1) {
      const pulse = 0.6 + Math.sin(state.gameTime * 16) * 0.4;
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(lx, ly, ringR + 8, 0, Math.PI * 2); ctx.fill();
    }
    // Ring de progression (arc)
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(lx, ly, ringR, -Math.PI / 2, -Math.PI / 2 + cr * Math.PI * 2);
    ctx.stroke();
    // Track de fond
    ctx.globalAlpha = 0.2;
    ctx.beginPath(); ctx.arc(lx, ly, ringR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

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


// ── Launcher visual — un design par arme ──────────────────────────────────────
export function drawLauncher(): void {
  const lx = state.LAUNCHER.x, ly = state.LAUNCHER.y;
  ctx.save();
  switch (state.selectedType) {
    case 'pelote':   drawSlingshot(lx, ly); break;
    case 'artifice': drawMortar(lx, ly);    break;
    case 'laser':    drawEmitter(lx, ly);   break;
    case 'carton':   drawCatapult(lx, ly);  break;
    default:         drawSlingshot(lx, ly);
  }
  ctx.restore();
}

function drawSlingshot(lx: number, ly: number): void {
  // Charge tend l'élastique vers le bas
  const cr = state.chargeRatio;
  const elasticDip = -18 - cr * 14;
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
  // élastique — magenta candy pop
  ctx.strokeStyle='#ff3ea5'; ctx.lineWidth=2.5;
  ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(lx-14,ly-22); ctx.quadraticCurveTo(lx,ly+elasticDip,lx+14,ly-22); ctx.stroke();
  ctx.setLineDash([]);
}

function drawMortar(lx: number, ly: number): void {
  const cr = state.chargeRatio;
  // Base bois
  ctx.fillStyle = '#5D4037';
  ctx.beginPath(); ctx.ellipse(lx, ly+38, 24, 9, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#6D4C41';
  ctx.beginPath(); ctx.roundRect(lx-18, ly+18, 36, 22, 4); ctx.fill();
  // Tube mortier (vertical, conique)
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.moveTo(lx-11, ly+22);
  ctx.lineTo(lx+11, ly+22);
  ctx.lineTo(lx+9,  ly-22);
  ctx.lineTo(lx-9,  ly-22);
  ctx.closePath(); ctx.fill();
  // Bouche du tube (ouverture sombre)
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(lx, ly-22, 9, 3, 0, 0, Math.PI*2); ctx.fill();
  // Cerclage métal en haut
  ctx.strokeStyle = '#90A4AE'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(lx, ly-21, 9, 3, 0, 0, Math.PI*2); ctx.stroke();
  // Mèche sortant du côté — étincelle si on charge
  ctx.strokeStyle = '#A66838'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(lx+9, ly-10); ctx.quadraticCurveTo(lx+22, ly-14, lx+24, ly-2); ctx.stroke();
  // Étincelle sur la mèche pendant la charge
  if (cr > 0) {
    const flicker = 0.6 + Math.sin(state.gameTime * 28) * 0.4;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(lx+24, ly-2, 2.5 + cr * 2 * flicker, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawEmitter(lx: number, ly: number): void {
  // Trépied
  ctx.strokeStyle = '#37474F'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(lx, ly+8);   ctx.lineTo(lx-16, ly+38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx, ly+8);   ctx.lineTo(lx+16, ly+38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx, ly+8);   ctx.lineTo(lx,    ly+40); ctx.stroke();
  // Pieds
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(lx-16, ly+38, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(lx+16, ly+38, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(lx,    ly+40, 3, 0, Math.PI*2); ctx.fill();
  // Boîtier émetteur (disque vertical)
  ctx.fillStyle = '#455A64';
  ctx.beginPath(); ctx.roundRect(lx-14, ly-12, 28, 24, 4); ctx.fill();
  ctx.strokeStyle = '#263238'; ctx.lineWidth = 1.5;
  ctx.stroke();
  // Anneau lumineux pulsant
  const pulse = 0.55 + Math.sin(state.gameTime * 6) * 0.45;
  ctx.strokeStyle = `rgba(255,40,80,${0.5 + pulse * 0.5})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(lx, ly, 9, 0, Math.PI*2); ctx.stroke();
  // Lentille rouge centrale
  const lens = ctx.createRadialGradient(lx, ly, 0, lx, ly, 8);
  lens.addColorStop(0, '#FFFFFF');
  lens.addColorStop(0.4, '#FF1744');
  lens.addColorStop(1, '#7A0024');
  ctx.fillStyle = lens;
  ctx.beginPath(); ctx.arc(lx, ly, 6.5, 0, Math.PI*2); ctx.fill();
  // Halo (faible)
  ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawCatapult(lx: number, ly: number): void {
  const cr = state.chargeRatio;
  // Plus on charge, plus le bras est tiré en arrière (vers le bas)
  const armAngle = -Math.PI/2 + cr * 0.9; // 0=vertical, charge=tiré
  // Base bois
  ctx.fillStyle = '#5D4037';
  ctx.beginPath(); ctx.ellipse(lx, ly+38, 26, 9, 0, 0, Math.PI*2); ctx.fill();
  // Cadre A (deux montants)
  ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(lx-16, ly+34); ctx.lineTo(lx-2, ly+4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx+16, ly+34); ctx.lineTo(lx+2, ly+4); ctx.stroke();
  // Pivot
  ctx.fillStyle = '#FFC107';
  ctx.beginPath(); ctx.arc(lx, ly+6, 3.5, 0, Math.PI*2); ctx.fill();
  // Bras de catapulte pivotant
  const armLen = 28;
  const ax = lx + Math.cos(armAngle) * armLen;
  const ay = (ly+6) + Math.sin(armAngle) * armLen;
  ctx.strokeStyle = '#6D4C41'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(lx, ly+6); ctx.lineTo(ax, ay); ctx.stroke();
  // Godet en bout de bras
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI*2); ctx.stroke();
  // Corde de tension (apparaît à mesure qu'on charge)
  if (cr > 0.05) {
    ctx.strokeStyle = `rgba(255,62,165,${0.4 + cr * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lx, ly+34); ctx.stroke();
    ctx.setLineDash([]);
  }
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
  for (let i = 0; i < TYPE_ORDER.length; i++) {
    const id = TYPE_ORDER[i];
    const def = PROJ_DEFS[id];
    const locked = !unlockedTypes.has(id);
    const isSelected = !locked && state.selectedType === id;
    const { x: sx, y: sy } = getSlotPos(i, TYPE_ORDER.length, state.W, state.DIAL_CY);
    const slotR = isSelected ? 34 : 28;

    ctx.save();

    if (locked) {
      // Dark background circle
      ctx.beginPath(); ctx.arc(sx, sy, slotR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20,10,45,0.78)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,206,58,0.45)'; ctx.lineWidth = 1.5;
      ctx.stroke();
      // Padlock dans la moitié haute du slot, hint dans la moitié basse — le tout INSIDE
      drawPadlock(sx, sy - slotR * 0.22, slotR * 0.55);
      ctx.font = `700 ${Math.round(slotR * 0.34)}px "Baloo 2",Arial`;
      ctx.fillStyle = '#ffce3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 2;
      ctx.fillText(def.unlockHint, sx, sy + slotR * 0.45);
      ctx.shadowBlur = 0;

    } else {
      const tone = def.col;
      const _wSpr = typeof WEAPON_SPRITES !== 'undefined' && WEAPON_SPRITES[id];
      const hasSprite = _wSpr && _wSpr.complete && _wSpr.naturalWidth > 0;

      // Selected: anneau jaune qui entoure l'arme (le pulse extérieur faisait doublon)
      if (isSelected) {
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

