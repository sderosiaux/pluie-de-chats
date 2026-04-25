import { showToast } from './unlock';
import { state, upgradeFlags, unlockedTypes, rechargeTimers } from './state';
import { canvas } from './canvas';
import { TYPE_ORDER, getSlotPos } from './config';
import { PROJ_DEFS } from './data';
import { fire, fireLaser, updateSteerLaser } from './fire';
import type { Pos } from './types';

export function getEventPos(e: MouseEvent | TouchEvent): Pos {
  const rect = canvas.getBoundingClientRect();
  const tev = e as TouchEvent;
  const mev = e as MouseEvent;
  const src = (tev.touches && tev.touches.length > 0)
    ? tev.touches[0]
    : (tev.changedTouches && tev.changedTouches.length > 0)
      ? tev.changedTouches[0]
      : mev;
  return { x: src.clientX - rect.left, y: src.clientY - rect.top };
}

export function handleDown(pos: Pos): void {
  // Sélection d'arme : uniquement si tap directement sur un slot du dial
  // (hit-radius généreux 44px). Tout le reste de l'écran = drag/fire.
  for (let i = 0; i < TYPE_ORDER.length; i++) {
    const { x: sx, y: sy } = getSlotPos(i, TYPE_ORDER.length, state.W, state.DIAL_CY);
    if (Math.hypot(pos.x - sx, pos.y - sy) < 44) {
      const id = TYPE_ORDER[i];
      if (unlockedTypes.has(id)) state.selectedType = id;
      return;
    }
  }
  state.pointerDown = true;
  state.isDragging = true;
  state.dragPos = pos;
  // Démarre la charge (hold-to-charge) — appliquée au release dans fire().
  // Pas pour le laser (qui tire dès le tap).
  if (state.selectedType !== 'laser') {
    state.chargeStart = state.gameTime;
    state.chargeRatio = 0;
  }
  // Laser : tire dès le tap pour pouvoir l'orienter pendant qu'on tient
  if (state.selectedType === 'laser' && state.wetTimer <= 0) {
    const def = (PROJ_DEFS as any)[state.selectedType];
    if (def.stock > 0 || upgradeFlags.cheatMode) {
      const dx = pos.x - state.LAUNCHER.x;
      const dy = pos.y - state.LAUNCHER.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= 8) {
        if (!upgradeFlags.cheatMode) {
          def.stock--;
          if (def.stock < def.maxStock && rechargeTimers[state.selectedType] <= 0) {
            rechargeTimers[state.selectedType] = def.recharge;
          }
        }
        state.activeSteerLaser = fireLaser(pos);
      }
    }
  }
}

export function handleMove(pos: Pos): void {
  if (!state.isDragging) return;
  state.dragPos = pos;
  // Pilote le laser tant qu'on tient
  if (state.activeSteerLaser && state.activeSteerLaser.life > 0) updateSteerLaser(pos);
}

export function handleUp(_pos: Pos): void {
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
  // Reset la charge après tir
  state.chargeStart = 0;
  state.chargeRatio = 0;
}

canvas.addEventListener('mousedown', e => handleDown(getEventPos(e)));
canvas.addEventListener('mousemove', e => { if (state.pointerDown) handleMove(getEventPos(e)); });
canvas.addEventListener('mouseup',   e => handleUp(getEventPos(e)));
canvas.addEventListener('touchstart', e => { e.preventDefault(); handleDown(getEventPos(e)); }, { passive: false });
canvas.addEventListener('touchmove',  e => { e.preventDefault(); handleMove(getEventPos(e)); }, { passive: false });
canvas.addEventListener('touchend',   e => { e.preventDefault(); handleUp(getEventPos(e)); },  { passive: false });

// Cheat code — tape "pluie" pour tout débloquer
document.addEventListener('keydown', e => {
  state._cheatBuf = (state._cheatBuf + e.key).slice(-5);
  if (state._cheatBuf === 'pluie') {
    const wasCheat = upgradeFlags.cheatMode;
    upgradeFlags.cheatMode = !wasCheat;
    if (upgradeFlags.cheatMode) {
      TYPE_ORDER.forEach(id => {
        unlockedTypes.add(id);
        const def = (PROJ_DEFS as any)[id];
        def.stock = 999;
        def.maxStock = 999;
        rechargeTimers[id] = 0;
      });
      showToast('⭐ CHEAT ON — toutes les armes, munitions infinies');
    } else {
      Object.assign((PROJ_DEFS as any).pelote,   { stock: 3, maxStock: 3 });
      Object.assign((PROJ_DEFS as any).artifice, { stock: 2, maxStock: 2 });
      Object.assign((PROJ_DEFS as any).laser,    { stock: 1, maxStock: 1 });
      Object.assign((PROJ_DEFS as any).carton,   { stock: 1, maxStock: 1 });
      showToast('⭐ CHEAT OFF');
    }
    state._cheatBuf = '';
  }
});
