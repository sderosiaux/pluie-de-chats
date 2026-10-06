// Joueurs automatiques pour la porte « chance / talent » (GAME_SPEC §29) et le validateur d'averses (§11).
// Hors de src/sim : ils peuvent utiliser Math.atan2. Leurs décisions passent par tryShoot, comme un humain.
//
// Les deux bots visent juste. Ils ne diffèrent que par le CHOIX : le naïf tire sur un chat au hasard à
// intervalles réguliers ; l'expert cherche le tir qui produit la plus grande chaîne et attend qu'il existe.
// L'écart entre eux mesure donc ce que la lecture du jeu rapporte, pas la précision du doigt.

import {
  ANGLE_MAX, ANGLE_MIN, CHARACTERS, LAUNCH_X, LAUNCH_Y, cloneSim, createRng, createSim,
  predictFirstContact, step, tryShoot,
} from '../sim';
import type { AverseDef, InputLog, SimState } from '../sim';

export type Bot = (s: SimState) => number | null;

export interface PlayResult {
  state: SimState;
  log: InputLog;
}

export function playAverse(averse: AverseDef, bot: Bot, maxTicks = 120 * 60 * 5): PlayResult {
  const s = createSim(averse);
  while (!s.ended && s.tick < maxTicks) {
    if (s.cooldown === 0 && s.pelotes > 0) {
      const a = bot(s);
      if (a !== null) tryShoot(s, a);
    }
    step(s);
    s.events.length = 0;
  }
  return { state: s, log: s.log.slice() };
}

const CANDIDATES: number[] = [];
for (let a = ANGLE_MIN; a <= ANGLE_MAX; a += 25) CANDIDATES.push(a);

export function angleTo(x: number, y: number): number {
  const deg = (Math.atan2(LAUNCH_Y - y, x - LAUNCH_X) * 180) / Math.PI;
  return Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, Math.round(deg * 10)));
}

function lastSpawnTick(averse: AverseDef): number {
  return averse.spawns.length ? averse.spawns[averse.spawns.length - 1].tick : 0;
}

/** Angle qui touche `catId` en premier, le plus proche d'une visée directe ; null si aucun. */
function aimAt(s: SimState, catId: number): number | null {
  const c = s.cats.find(k => k.id === catId);
  if (!c) return null;
  const direct = angleTo(c.x, c.y);
  let best: number | null = null;
  for (const a of CANDIDATES.concat([direct]).sort((p, q) => Math.abs(p - direct) - Math.abs(q - direct))) {
    const p = predictFirstContact(s, a);
    if (p && p.catId === catId && p.kind === 'catch') { best = a; break; }
  }
  return best;
}

/** Naïf : à intervalles réguliers, tire juste sur un chat visible choisi au hasard (jamais un chien). */
export function naiveBot(averse: AverseDef, seed: number): Bot {
  const rng = createRng(seed);
  const interval = Math.max(60, Math.floor((lastSpawnTick(averse) + 8 * 120) / averse.pelotes));
  let nextFire = interval / 2;
  return s => {
    if (s.tick < nextFire) return null;
    const visible = s.cats.filter(c => c.st === 'fall' && c.char !== 'chien' && c.y > 40 && c.y < 520);
    if (!visible.length) return null;
    for (let tries = 0; tries < 4; tries++) {
      const target = rng.pick(visible);
      const a = aimAt(s, target.id);
      if (a !== null) { nextFire = s.tick + interval; return a; }
    }
    return null;
  };
}

/** Valeur d'un tir : taille de la chaîne qu'il déclenche, chiens touchés pénalisés comme au score. */
export function evaluateShot(s: SimState, angleDeci: number, horizon = 600): { n: number; value: number } {
  const sim = cloneSim(s);
  if (tryShoot(sim, angleDeci) !== 'ok') return { n: 0, value: -Infinity };
  const ballId = sim.nextId - 1;
  let chainId = -1;
  let dogs = 0;
  for (let t = 0; t < horizon && !sim.ended; t++) {
    step(sim);
    for (const e of sim.events) {
      if (e.type === 'catch' && e.ballId === ballId) chainId = e.chainId;
      else if (e.type === 'dog' && (e.ballId === ballId || chainId >= 0)) dogs++;
      else if (e.type === 'ballLost' && e.ballId === ballId && chainId < 0) return { n: 0, value: -dogs * 5 };
      else if (e.type === 'chainEnd' && e.chainId === chainId) return { n: e.n, value: e.n * e.n - dogs * 5 };
    }
    sim.events.length = 0;
  }
  return { n: 0, value: -dogs * 5 };
}

/**
 * Expert « patient » : toutes les `every` ticks, simule chaque angle candidat jusqu'à la fin de la chaîne
 * qu'il déclenche, et ne tire que pour une grosse chaîne (≥ `minChain`), pour sauver des chats qui
 * sortent (≥ `escapeChain`), ou en fin d'averse. Retenu parmi 4 stratégies essayées (seuil 5, 6, 8,
 * anticipation du timing) : c'est la plus forte sur les trois averses, avec les mêmes réglages partout.
 */
export function expertBot(averse: AverseDef, every = 10, minChain = 8, escapeChain = 5): Bot {
  const last = lastSpawnTick(averse);
  return s => {
    if (s.tick % every !== 0) return null;
    let bestA = -1, bestN = 0, bestV = -Infinity;
    for (const a of CANDIDATES) {
      const r = evaluateShot(s, a);
      if (r.value > bestV) { bestV = r.value; bestN = r.n; bestA = a; }
    }
    if (bestA < 0 || bestV <= 0) return null;
    const escaping = s.cats.some(c => c.st === 'fall' && CHARACTERS[c.char].catchable && c.y > 520);
    const lateGame = s.tick > last + 240;
    if (bestN >= minChain || (escaping && bestN >= escapeChain) || (lateGame && bestN >= 1 && s.pelotes > 1)) return bestA;
    return null;
  };
}
