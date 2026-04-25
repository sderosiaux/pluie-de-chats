// @ts-nocheck
import { showToast } from './unlock';
import { state, upgradeFlags, unlockedTypes, rechargeTimers } from './state';
import { canvas } from './canvas';
import { DIAL_R, DIAL_ANGLES, TYPE_ORDER } from './config';
import { PROJ_DEFS } from './data';
import { fire, fireLaser, computeLaserEnd } from './fire';

// ── Input ─────────────────────────────────────────────────────────────────────

export function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  const src = (e.touches && e.touches.length > 0)
    ? e.touches[0]
    : (e.changedTouches && e.changedTouches.length > 0)
      ? e.changedTouches[0]
      : e;
  return { x: src.clientX - rect.left, y: src.clientY - rect.top };
}

export function handleDown(pos) {
  // Sélection d'arme : uniquement si tap directement sur un slot du dial
  // (hit-radius généreux 44px). Tout le reste de l'écran = drag/fire.
  const dcx = state.W / 2, dcy = state.DIAL_CY;
  for (let i = 0; i < TYPE_ORDER.length; i++) {
    const ang = DIAL_ANGLES[i] * Math.PI / 180;
    const sx = dcx + Math.cos(ang) * DIAL_R;
    const sy = dcy + Math.sin(ang) * DIAL_R;
    if (Math.hypot(pos.x - sx, pos.y - sy) < 44) {
      const id = TYPE_ORDER[i];
      if (unlockedTypes.has(id)) state.selectedType = id;
      return;
    }
  }
  state.pointerDown = true;
  state.isDragging = true;
  state.dragPos = pos;
  // Laser : tire dès le tap pour pouvoir l'orienter pendant qu'on tient
  if (state.selectedType === 'laser' && state.wetTimer <= 0) {
    const def = PROJ_DEFS[state.selectedType];
    if (def.stock > 0 || upgradeFlags.cheatMode) {
      const dx = pos.x - state.LAUNCHER.x, dy = pos.y - state.LAUNCHER.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= 8) {
        const nx = dx/dist, ny = dy/dist;
        if (!upgradeFlags.cheatMode) {
          def.stock--;
          if (def.stock < def.maxStock && rechargeTimers[state.selectedType] <= 0)
            rechargeTimers[state.selectedType] = def.recharge;
        }
        state.activeSteerLaser = fireLaser(nx, ny, 0);
      }
    }
  }
}

export function handleMove(pos) {
  if (!state.isDragging) return;
  state.dragPos = pos;
  // Pilote le laser tant qu'on tient
  if (state.activeSteerLaser && state.activeSteerLaser.life > 0) updateSteerLaser(pos);
}

export function handleUp(pos) {
  if (!state.isDragging || !state.pointerDown) return;
  state.isDragging = false;
  state.pointerDown = false;
  // Laser : on relâche, plus de pilotage (l'effet finit sa durée)
  if (state.activeSteerLaser) {
    state.activeSteerLaser = null;
  } else if (state.dragPos) {
    fire(state.dragPos);
  }
  state.dragPos = null;
}

canvas.addEventListener('mousedown', e => handleDown(getEventPos(e)));
canvas.addEventListener('mousemove', e => { if (state.pointerDown) handleMove(getEventPos(e)); });
canvas.addEventListener('mouseup',   e => handleUp(getEventPos(e)));
canvas.addEventListener('touchstart', e => { e.preventDefault(); handleDown(getEventPos(e)); }, {passive:false});
canvas.addEventListener('touchmove',  e => { e.preventDefault(); handleMove(getEventPos(e)); }, {passive:false});
canvas.addEventListener('touchend',   e => { e.preventDefault(); handleUp(getEventPos(e)); },  {passive:false});


// ── Cheat code — tape "pluie" pour tout débloquer ────────────────────────────
document.addEventListener('keydown', e => {
  state._cheatBuf = (state._cheatBuf + e.key).slice(-5);
  if (state._cheatBuf === 'pluie') {
    const wasCheat = upgradeFlags.cheatMode;
    upgradeFlags.cheatMode = !wasCheat;
    if (upgradeFlags.cheatMode) {
      TYPE_ORDER.forEach(id => {
        unlockedTypes.add(id);
        PROJ_DEFS[id].stock = 999;
        PROJ_DEFS[id].maxStock = 999;
        rechargeTimers[id] = 0;
      });
      showToast('🐱 CHEAT ON — toutes les armes, munitions infinies');
    } else {
      Object.assign(PROJ_DEFS.pelote,  {stock:3,  maxStock:3});
      Object.assign(PROJ_DEFS.artifice,{stock:2,  maxStock:2});
      Object.assign(PROJ_DEFS.laser,   {stock:1,  maxStock:1});
      Object.assign(PROJ_DEFS.carton,  {stock:1,  maxStock:1});
      showToast('🐱 CHEAT OFF');
    }
    state._cheatBuf = '';
  }
});

