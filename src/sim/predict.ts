// Ligne de visée (§13) : simule le tir sur une copie et rapporte le PREMIER contact seulement.
// La suite de la chaîne n'est jamais prédite : c'est la part de découverte.

import { cloneSim, step, tryShoot } from './sim';
import type { Prediction, SimState } from './types';

const HORIZON_TICKS = 120; // 1 s
const PATH_EVERY = 3;

export function predictFirstContact(s: SimState, angleDeci: number): Prediction | null {
  const sim = cloneSim(s);
  // On montre le tir tel qu'il partirait maintenant, recharge et stock mis à part.
  sim.cooldown = 0;
  if (sim.pelotes < 1) sim.pelotes = 1;
  if (tryShoot(sim, angleDeci) !== 'ok') return null;
  const ballId = sim.nextId - 1;

  const path: Array<{ x: number; y: number }> = [];
  const dodges: number[] = [];
  const none = (): Prediction => ({ kind: 'none', path, x: 0, y: 0, catId: -1, dirX: 0, dirY: 0, dodges });

  for (let t = 0; t < HORIZON_TICKS && !sim.ended; t++) {
    const ball = sim.balls.find(b => b.id === ballId);
    if (ball && t % PATH_EVERY === 0) path.push({ x: ball.x, y: ball.y });
    step(sim);
    for (const e of sim.events) {
      if (e.type === 'dodge' && e.ballId === ballId) dodges.push(e.catId);
      else if (e.type === 'catch' && e.ballId === ballId) {
        path.push({ x: e.x, y: e.y });
        const sp = Math.sqrt(e.vx * e.vx + e.vy * e.vy) || 1;
        return { kind: 'catch', path, x: e.x, y: e.y, catId: e.catId, dirX: e.vx / sp, dirY: e.vy / sp, dodges };
      } else if (e.type === 'dog' && e.ballId === ballId) {
        return { kind: 'dog', path, x: e.x, y: e.y, catId: e.catId, dirX: 0, dirY: 0, dodges };
      } else if (e.type === 'shield' && e.ballId === ballId) {
        return { kind: 'shield', path, x: e.x, y: e.y, catId: e.catId, dirX: 0, dirY: 0, dodges };
      } else if (e.type === 'ballLost' && e.ballId === ballId) {
        return none();
      }
    }
    sim.events.length = 0;
  }
  return none();
}
