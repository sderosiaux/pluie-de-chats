// @ts-nocheck
import { state, projectiles, effects, rechargeTimers, upgradeFlags } from './state';
import { GRAVITY, MAX_PULL, HUD_H } from './config';
import { PROJ_DEFS } from './data';
import { spawnParticles, showStaticMsg } from './effects';

// ── Fire projectile ───────────────────────────────────────────────────────────
export function fire(fingerPos) {
  if (state.wetTimer > 0) {
    showStaticMsg(state.LAUNCHER.x, state.LAUNCHER.y - 44, `💧 mouillé !`, '#5BB6E8');
    return;
  }
  const def = PROJ_DEFS[state.selectedType];
  if (def.stock <= 0) {
    const secsLeft = Math.ceil(rechargeTimers[state.selectedType]);
    showStaticMsg(state.LAUNCHER.x, state.LAUNCHER.y - 44, `${def.emoji} ${secsLeft}s`, '#ffce3a');
    return;
  }

  const dx = fingerPos.x - state.LAUNCHER.x;
  const dy = fingerPos.y - state.LAUNCHER.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) return;

  const pull = Math.pow(Math.min(dist, MAX_PULL) / MAX_PULL, 0.65); // courbe exponentielle : max pull = vrai boost
  const nx = dx/dist, ny = dy/dist;
  const spd = def.speed[0] + pull * (def.speed[1] - def.speed[0]);

  if (!upgradeFlags.cheatMode) {
    def.stock--;
    if (def.stock < def.maxStock && rechargeTimers[state.selectedType] <= 0)
      rechargeTimers[state.selectedType] = def.recharge;
  }

  if (state.selectedType === 'laser') {
    fireLaser(nx, ny, spd);
    return;
  }

  const p = {
    x: state.LAUNCHER.x, y: state.LAUNCHER.y,
    vx: nx * spd, vy: ny * spd,
    type: state.selectedType,
    r: state.selectedType === 'pelote' ? 11 : state.selectedType === 'carton' ? 18 : 13,
    gravity: def.gravity,
    bounces: def.bounces || 0,
    fuseTimer: def.fuseTime || 999,
    fuseAngle: Math.atan2(ny, nx) + Math.PI,
    fuseDistance: state.selectedType === 'artifice' ? spd * 42 + Math.random() * 70 + (upgradeFlags.artificeDistBonus||0) : 0,
    distTraveled: 0,
    rot: 0, rotSpd: (Math.random()-.5)*.18,
    trail: [], trailTimer: 0,
    active: true,
  };
  projectiles.push(p);
}

export function computeLaserEnd(nx, ny) {
  const lx = state.LAUNCHER.x, ly = state.LAUNCHER.y;
  let t = Infinity;
  if (nx > 0) t = Math.min(t, (state.W - lx) / nx);
  if (nx < 0) t = Math.min(t, (0 - lx) / nx);
  if (ny > 0) t = Math.min(t, (state.H - ly) / ny);
  if (ny < 0) t = Math.min(t, (HUD_H - ly) / ny);
  return { x: lx + nx*t, y: ly + ny*t };
}

export function fireLaser(nx, ny, spd) {
  const lx = state.LAUNCHER.x, ly = state.LAUNCHER.y;
  const end = computeLaserEnd(nx, ny);
  const eff = { type:'active_laser', x1:lx, y1:ly, x2:end.x, y2:end.y, life:1, dur:1.5, age:0, caught:0, caughtIds:new Set() };
  effects.push(eff);
  spawnParticles(state.LAUNCHER.x, state.LAUNCHER.y, 8, false);
  return eff;
}

export function updateSteerLaser(pos) {
  if (!state.activeSteerLaser) return;
  const dx = pos.x - state.LAUNCHER.x, dy = pos.y - state.LAUNCHER.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) return;
  const nx = dx/dist, ny = dy/dist;
  const end = computeLaserEnd(nx, ny);
  state.activeSteerLaser.x2 = end.x;
  state.activeSteerLaser.y2 = end.y;
}

