import { state, projectiles, effects, rechargeTimers, upgradeFlags } from './state';
import { MAX_PULL } from './config';
import { PROJ_DEFS } from './data';
import { WEAPON_SPRITES } from './sprites';
import { spawnParticles, showStaticMsg } from './effects';
import { Music } from './audio';
import type { Pos, Effect } from './types';

export function fire(fingerPos: Pos): void {
  if (state.wetTimer > 0) {
    showStaticMsg(state.LAUNCHER.x, state.LAUNCHER.y - 44, `💧 mouillé !`, '#5BB6E8');
    return;
  }
  const def = (PROJ_DEFS as any)[state.selectedType];
  if (def.stock <= 0) {
    const secsLeft = Math.ceil(rechargeTimers[state.selectedType]);
    showStaticMsg(state.LAUNCHER.x, state.LAUNCHER.y - 44, `${secsLeft}s`, '#ffce3a', WEAPON_SPRITES[state.selectedType]);
    return;
  }

  const dx = fingerPos.x - state.LAUNCHER.x;
  const dy = fingerPos.y - state.LAUNCHER.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) return;

  // courbe exponentielle : max pull = vrai boost
  const pull = Math.pow(Math.min(dist, MAX_PULL) / MAX_PULL, 0.65);
  const nx = dx / dist;
  const ny = dy / dist;
  const spd = def.speed[0] + pull * (def.speed[1] - def.speed[0]);

  if (!upgradeFlags.cheatMode) {
    def.stock--;
    if (def.stock < def.maxStock && rechargeTimers[state.selectedType] <= 0) {
      rechargeTimers[state.selectedType] = def.recharge;
    }
  }

  if (state.selectedType === 'laser') {
    fireLaser(fingerPos);
    return;
  }

  if (state.selectedType === 'pelote') Music.sfxPelote();
  else if (state.selectedType === 'artifice') Music.sfxArtifice();
  else if (state.selectedType === 'carton') Music.sfxCarton();

  // Charge bonus — hold-to-charge ratio appliqué selon l'arme
  // chargeBonus upgrade : étend la profondeur du bonus (+50% ou +100%)
  const charge = state.chargeRatio; // 0..1
  const bonusMult = 1 + (upgradeFlags.chargeBonus || 0); // 1, 1.5, 2 selon stack

  // Pelote : +2 rebonds à pleine charge
  const peloteBonusBounces = state.selectedType === 'pelote' ? Math.round(2 * charge * bonusMult) : 0;
  // Artifice : blastR x2, fuseDistance x1.4
  const artificeBlastFactor = state.selectedType === 'artifice' ? (1 + charge * bonusMult) : 1;
  const artificeFuseFactor  = state.selectedType === 'artifice' ? (1 + charge * 0.4 * bonusMult) : 1;

  projectiles.push({
    x: state.LAUNCHER.x, y: state.LAUNCHER.y,
    vx: nx * spd, vy: ny * spd,
    type: state.selectedType,
    r: state.selectedType === 'pelote' ? 11 : state.selectedType === 'carton' ? 18 : 13,
    gravity: def.gravity,
    bounces: (def.bounces || 0) + peloteBonusBounces,
    fuseTimer: def.fuseTime || 999,
    fuseAngle: Math.atan2(ny, nx) + Math.PI,
    fuseDistance: state.selectedType === 'artifice'
      ? (spd * 42 + Math.random() * 70 + (upgradeFlags.artificeDistBonus || 0)) * artificeFuseFactor
      : 0,
    distTraveled: 0,
    rot: 0, rotSpd: (Math.random() - .5) * .18,
    trail: [], trailTimer: 0,
    active: true,
    chargeBlastFactor: artificeBlastFactor,        // utilisé par explode() pour artifice
    chargeCartonFactor: state.selectedType === 'carton' ? (1 + charge * 0.4 * bonusMult) : 1,
    chargeCartonDurBonus: state.selectedType === 'carton' ? (charge * bonusMult) : 0, // +1s à pleine charge
  } as any);
}

export function fireLaser(endPos: Pos): Effect {
  const lx = state.LAUNCHER.x;
  const ly = state.LAUNCHER.y;
  const eff: Effect = {
    type: 'active_laser',
    x1: lx, y1: ly, x2: endPos.x, y2: endPos.y,
    life: 1, dur: 1.5, age: 0,
    caught: 0, caughtIds: new Set<number>(),
  };
  effects.push(eff);
  spawnParticles(lx, ly, 8, false);
  Music.sfxLaser();
  return eff;
}

export function updateSteerLaser(pos: Pos): void {
  if (!state.activeSteerLaser) return;
  state.activeSteerLaser.x2 = pos.x;
  state.activeSteerLaser.y2 = pos.y;
}
