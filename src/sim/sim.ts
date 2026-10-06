// Simulation déterministe de GAME_SPEC §7. Un tick = 1/120 s.
// Ordre d'un tick : apparitions → chute (loi 1) → pelotes (loi 2) → boulets (lois 3–4)
// → sorties → fins de chaîne (loi 5) → fin d'averse (loi 7).
// Toutes les boucles parcourent des tableaux triés par id : c'est ce qui tranche les égalités (§7).

import {
  ANGLE_MAX, ANGLE_MIN, BALL_G, BALL_MAX_BOUNCES, BALL_R, BALL_SPEED, BOULET_G, CAT_BASE_R,
  COOLDOWN_TICKS, DODGE_RADIUS, DOG_PENALTY, DT, ESCORT_PULL_SPEED, LAUNCH_X, LAUNCH_Y,
  LEAP_COOLDOWN_TICKS, LEAP_DAMP, LEAP_SPEED, MAX_BOULET_SPEED, MIN_BOULET_SPEED, PELOTE_BONUS,
  REFUND_MIN_CHAIN, RESTITUTION, STAR_THRESHOLDS, SWAY_PERIOD_TICKS, WORLD_H, WORLD_W,
} from './constants';
import { CHARACTERS, ELASTIC_RESTITUTION } from './characters';
import { dirFromAngleDeci, fsin } from './fmath';
import type { AverseDef, Ball, Cat, Chain, InputLog, ShotResult, SimEvent, SimState } from './types';

/** Les averses sont partagées entre parties (et avec le serveur) : on les gèle en profondeur. */
function freezeAverse(averse: AverseDef): AverseDef {
  if (!Object.isFrozen(averse)) {
    for (const sp of averse.spawns) Object.freeze(sp);
    Object.freeze(averse.spawns);
    Object.freeze(averse);
  }
  return averse;
}

export function createSim(averse: AverseDef): SimState {
  freezeAverse(averse);
  return {
    averse,
    tick: 0,
    nextSpawn: 0,
    nextId: 1,
    spawnToCat: averse.spawns.map(() => -1),
    cats: [],
    balls: [],
    chains: [],
    pelotes: averse.pelotes,
    cooldown: 0,
    score: 0,
    caught: 0,
    missed: 0,
    dogsHit: 0,
    bestChain: 0,
    ended: false,
    log: [],
    events: [],
  };
}

export function cloneSim(s: SimState): SimState {
  return {
    ...s,
    spawnToCat: s.spawnToCat.slice(),
    cats: s.cats.map(c => ({ ...c })),
    balls: s.balls.map(b => ({ ...b })),
    chains: s.chains.map(c => ({ ...c })),
    log: s.log.map(e => ({ ...e })),
    events: [],
  };
}

export function drainEvents(s: SimState): SimEvent[] {
  const out = s.events;
  s.events = [];
  return out;
}

export function catchableCount(averse: AverseDef): number {
  let n = 0;
  for (const sp of averse.spawns) if (CHARACTERS[sp.char].catchable) n++;
  return n;
}

export function stars(s: SimState): 0 | 1 | 2 | 3 {
  const total = catchableCount(s.averse);
  const ratio = total === 0 ? 0 : s.caught / total;
  if (ratio >= STAR_THRESHOLDS[2]) return 3;
  if (ratio >= STAR_THRESHOLDS[1]) return 2;
  if (ratio >= STAR_THRESHOLDS[0]) return 1;
  return 0;
}

/** Score final (§7 loi 7). Borné à 0 : un score négatif n'a pas de sens au classement. */
export function finalScore(s: SimState): number {
  return Math.max(0, s.score + PELOTE_BONUS * s.pelotes);
}

// ── Tir (loi 2, déclenchement) ───────────────────────────────────────────────

/** Applique un tir au tick courant, avant `step`. N'avance pas le temps. */
export function tryShoot(s: SimState, angleDeci: number): ShotResult {
  if (s.ended) return 'ended';
  if (!Number.isInteger(angleDeci) || angleDeci < ANGLE_MIN || angleDeci > ANGLE_MAX) return 'angle';
  if (s.pelotes <= 0) return 'empty';
  if (s.cooldown > 0) return 'cooldown';
  const d = dirFromAngleDeci(angleDeci);
  s.pelotes--;
  s.cooldown = COOLDOWN_TICKS;
  s.balls.push({ id: s.nextId++, x: LAUNCH_X, y: LAUNCH_Y, vx: d.x * BALL_SPEED, vy: d.y * BALL_SPEED, bounces: BALL_MAX_BOUNCES });
  s.log.push({ tick: s.tick, angleDeci });
  s.events.push({ type: 'shot', tick: s.tick, angleDeci });
  return 'ok';
}

// ── Tick ─────────────────────────────────────────────────────────────────────

export function step(s: SimState): void {
  if (s.ended) return;
  spawnDue(s);
  updateFalling(s);
  updateBalls(s);
  updateBoulets(s);
  releaseShieldImmunity(s);
  removeGone(s);
  closeChains(s);
  if (s.cooldown > 0) s.cooldown--;
  s.tick++;
  checkEnd(s);
}

function spawnDue(s: SimState): void {
  const spawns = s.averse.spawns;
  while (s.nextSpawn < spawns.length && spawns[s.nextSpawn].tick <= s.tick) {
    const idx = s.nextSpawn++;
    const sp = spawns[idx];
    const def = CHARACTERS[sp.char];
    const r = CAT_BASE_R * def.scale;
    const escortOf = sp.escortOf !== undefined ? s.spawnToCat[sp.escortOf] ?? -1 : -1;
    const cat: Cat = {
      id: s.nextId++,
      spawnIdx: idx,
      char: sp.char,
      costume: sp.costume,
      r,
      st: 'fall',
      x: sp.x,
      y: -r,
      anchorX: sp.x,
      vx: 0,
      vy: def.fallSpeed,
      age: 0,
      swayAmp: sp.swayAmp,
      swayPhase: sp.swayPhase,
      leapVx: 0,
      leapCd: 0,
      shield: sp.char === 'bouclier',
      shieldImmune: -1,
      life: 0,
      chainId: -1,
      escortOf,
      escortDx: sp.escortDx ?? 0,
      escortDy: sp.escortDy ?? 0,
    };
    s.spawnToCat[idx] = cat.id;
    s.cats.push(cat);
  }
}

function findCat(s: SimState, id: number): Cat | undefined {
  for (const c of s.cats) if (c.id === id) return c;
  return undefined;
}

// Loi 1 — chute
function updateFalling(s: SimState): void {
  for (const c of s.cats) {
    if (c.st !== 'fall') continue;
    c.age++;
    if (c.leapCd > 0) c.leapCd--;

    if (c.escortOf >= 0) {
      const mom = findCat(s, c.escortOf);
      if (mom && mom.st === 'fall') {
        c.x = clamp(mom.x + c.escortDx, c.r, WORLD_W - c.r);
        c.y = mom.y + c.escortDy;
        continue;
      }
      // La maman est partie : le chaton redevient autonome à partir de sa position.
      c.escortOf = -1;
      c.anchorX = c.x;
      c.age = 0;
      c.swayAmp = 0;
    }

    if (c.char === 'trouillard' && c.leapCd === 0) {
      for (const b of s.balls) {
        const dx = c.x - b.x, dy = c.y - b.y;
        if (dx * dx + dy * dy < DODGE_RADIUS * DODGE_RADIUS) {
          c.leapVx = (c.x <= b.x ? -1 : 1) * LEAP_SPEED;
          c.leapCd = LEAP_COOLDOWN_TICKS;
          s.events.push({ type: 'dodge', catId: c.id, ballId: b.id });
          break;
        }
      }
    }

    c.anchorX += c.leapVx * DT;
    c.leapVx *= LEAP_DAMP;
    c.y += c.vy * DT;
    c.x = c.anchorX + c.swayAmp * fsin(c.swayPhase + c.age / SWAY_PERIOD_TICKS);
    if (c.x < c.r) { c.anchorX += c.r - c.x; c.x = c.r; c.leapVx = Math.abs(c.leapVx); }
    else if (c.x > WORLD_W - c.r) { c.anchorX -= c.x - (WORLD_W - c.r); c.x = WORLD_W - c.r; c.leapVx = -Math.abs(c.leapVx); }
  }
}

// Loi 2 — impact de la pelote
function updateBalls(s: SimState): void {
  const keep: Ball[] = [];
  for (const b of s.balls) {
    b.vy += BALL_G * DT;
    b.x += b.vx * DT;
    b.y += b.vy * DT;
    if (b.x < BALL_R || b.x > WORLD_W - BALL_R) {
      if (b.bounces > 0) {
        b.bounces--;
        b.vx = -b.vx;
        b.x = b.x < BALL_R ? BALL_R : WORLD_W - BALL_R;
      }
    }
    if (b.y < -BALL_R || b.y > WORLD_H + BALL_R || b.x < -BALL_R || b.x > WORLD_W + BALL_R) {
      s.events.push({ type: 'ballLost', ballId: b.id });
      continue;
    }

    // Plusieurs chats touchés au même tick : le plus petit id gagne (parcours trié).
    let target: Cat | undefined;
    for (const c of s.cats) {
      if (c.st !== 'fall' || c.shieldImmune === b.id) continue;
      const dx = c.x - b.x, dy = c.y - b.y, rr = c.r + BALL_R;
      if (dx * dx + dy * dy < rr * rr) { target = c; break; }
    }
    if (!target) { keep.push(b); continue; }

    const n = normal(b.x, b.y, target.x, target.y);
    if (target.char === 'chien') {
      hitDog(s, target, 'ball', b.id, -1);
      continue; // pelote absorbée
    }
    if (target.char === 'bouclier' && target.shield) {
      target.shield = false;
      target.shieldImmune = b.id;
      reflect(b, n.x, n.y);
      s.events.push({ type: 'shield', catId: target.id, x: target.x, y: target.y, ballId: b.id });
      keep.push(b);
      continue;
    }
    const chain: Chain = { id: s.nextId++, n: 0, alive: 0, done: false };
    s.chains.push(chain);
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * CHARACTERS[target.char].transfer;
    makeBoulet(s, target, n.x * speed, n.y * speed, chain, b.id);
    // pelote absorbée
  }
  s.balls = keep;
}

// Lois 3 et 4 — propagation et vie des boulets
function updateBoulets(s: SimState): void {
  // Liste figée en début de phase : un chat devenu boulet pendant cette phase ne bouge qu'au tick
  // suivant, quel que soit son id (sinon une chaîne pourrait traverser plusieurs maillons en un tick).
  const boulets = s.cats.filter(c => c.st === 'boulet');
  for (const b of boulets) {
    const fusee = b.char === 'fusee';
    if (!fusee) b.vy += BOULET_G * DT;
    b.x += b.vx * DT;
    b.y += b.vy * DT;
    if (!fusee) {
      const rest = b.char === 'elastique' ? ELASTIC_RESTITUTION : RESTITUTION;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * rest; s.events.push({ type: 'bounce', catId: b.id, x: b.x, y: b.y }); }
      else if (b.x > WORLD_W - b.r) { b.x = WORLD_W - b.r; b.vx = -Math.abs(b.vx) * rest; s.events.push({ type: 'bounce', catId: b.id, x: b.x, y: b.y }); }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * rest; }
      capSpeed(b);
    }
    b.life--;

    if (b.char === 'fantome') continue; // un fantôme en boulet ne touche rien
    const chain = s.chains.find(ch => ch.id === b.chainId);
    if (!chain) continue;
    for (const c of s.cats) {
      if (c.st !== 'fall' || c.char === 'fantome' || c.shieldImmune === b.id) continue;
      const dx = c.x - b.x, dy = c.y - b.y, rr = c.r + b.r;
      if (dx * dx + dy * dy >= rr * rr) continue;
      const n = normal(b.x, b.y, c.x, c.y);
      if (c.char === 'chien') {
        hitDog(s, c, 'boulet', -1, chain.id);
        b.life = 0; // la chaîne s'arrête de ce côté
        break;
      }
      if (c.char === 'bouclier' && c.shield) {
        c.shield = false;
        s.events.push({ type: 'shield', catId: c.id, x: c.x, y: c.y, ballId: -1 });
        if (b.char !== 'gros') { c.shieldImmune = b.id; reflect(b, n.x, n.y); continue; }
        // Le gros compte pour les deux contacts : le bouclier part tout de suite (§9).
      }
      const sp = Math.max(MIN_BOULET_SPEED, Math.sqrt(b.vx * b.vx + b.vy * b.vy) * CHARACTERS[b.char].transfer);
      makeBoulet(s, c, n.x * sp, n.y * sp, chain, -1);
      if (b.char !== 'gros') {
        const mB = CHARACTERS[b.char].mass, mC = CHARACTERS[c.char].mass;
        deflect(b, n.x, n.y, (2 * mC) / (mB + mC));
      }
    }
  }
}

/** `ballId` = pelote responsable, -1 si c'est un boulet. */
function makeBoulet(s: SimState, c: Cat, vx: number, vy: number, chain: Chain, ballId: number): void {
  const sp = Math.sqrt(vx * vx + vy * vy);
  if (sp < MIN_BOULET_SPEED) {
    const k = sp === 0 ? 0 : MIN_BOULET_SPEED / sp;
    vx = sp === 0 ? 0 : vx * k;
    vy = sp === 0 ? -MIN_BOULET_SPEED : vy * k;
  }
  c.st = 'boulet';
  c.vx = vx;
  c.vy = vy;
  c.life = CHARACTERS[c.char].lifeTicks;
  c.chainId = chain.id;
  c.escortOf = -1;
  chain.n++;
  chain.alive++;
  s.caught++;
  s.events.push({ type: 'catch', catId: c.id, chainId: chain.id, n: chain.n, x: c.x, y: c.y, vx: c.vx, vy: c.vy, by: ballId >= 0 ? 'ball' : 'boulet', ballId });

  if (c.char === 'maman') {
    // Ses chatons encore en escorte partent vers elle, dans la même chaîne (§8).
    for (const k of s.cats) {
      if (k.st !== 'fall' || k.escortOf !== c.id) continue;
      const n = normal(k.x, k.y, c.x, c.y);
      makeBoulet(s, k, n.x * ESCORT_PULL_SPEED, n.y * ESCORT_PULL_SPEED, chain, -1);
    }
  }
}

function hitDog(s: SimState, dog: Cat, by: 'ball' | 'boulet', ballId: number, chainId: number): void {
  dog.st = 'gone';
  s.score -= DOG_PENALTY;
  s.dogsHit++;
  s.events.push({ type: 'dog', catId: dog.id, x: dog.x, y: dog.y, by, ballId, chainId });
}

/**
 * Un bouclier vient d'être cassé : son tapeur reste ignoré tant qu'ils se chevauchent. Sinon, sur un
 * choc rasant, le même tapeur l'attraperait au tick suivant et le bouclier « prendrait deux coups » d'un seul.
 */
function releaseShieldImmunity(s: SimState): void {
  for (const c of s.cats) {
    if (c.shieldImmune < 0) continue;
    let hx = 0, hy = 0, hr = 0, found = false;
    for (const b of s.balls) if (b.id === c.shieldImmune) { hx = b.x; hy = b.y; hr = BALL_R; found = true; break; }
    if (!found) for (const k of s.cats) if (k.id === c.shieldImmune && k.st === 'boulet') { hx = k.x; hy = k.y; hr = k.r; found = true; break; }
    const dx = c.x - hx, dy = c.y - hy, rr = c.r + hr;
    if (!found || dx * dx + dy * dy >= rr * rr) c.shieldImmune = -1;
  }
}

function removeGone(s: SimState): void {
  const keep: Cat[] = [];
  for (const c of s.cats) {
    if (c.st === 'fall' && c.y > WORLD_H + c.r) {
      if (CHARACTERS[c.char].catchable) {
        s.missed++;
        s.events.push({ type: 'miss', catId: c.id, x: c.x });
      }
      continue;
    }
    if (c.st === 'boulet' && (c.life <= 0 || c.y > WORLD_H + c.r || c.y < -4 * c.r || c.x < -4 * c.r || c.x > WORLD_W + 4 * c.r)) {
      const chain = s.chains.find(ch => ch.id === c.chainId);
      if (chain) chain.alive--;
      continue;
    }
    if (c.st === 'gone') continue;
    keep.push(c);
  }
  s.cats = keep;
}

// Loi 5 — fin de chaîne
function closeChains(s: SimState): void {
  const open: Chain[] = [];
  for (const ch of s.chains) {
    if (ch.alive > 0) { open.push(ch); continue; }
    const points = ch.n * ch.n;
    const refund = ch.n >= REFUND_MIN_CHAIN;
    s.score += points;
    if (refund) s.pelotes++;
    if (ch.n > s.bestChain) s.bestChain = ch.n;
    ch.done = true;
    s.events.push({ type: 'chainEnd', chainId: ch.id, n: ch.n, points, refund });
  }
  s.chains = open;
}

// Loi 7 — fin d'averse
function checkEnd(s: SimState): void {
  if (s.nextSpawn < s.averse.spawns.length) return;
  if (s.cats.length > 0 || s.balls.length > 0 || s.chains.length > 0) return;
  s.ended = true;
  s.events.push({ type: 'end' });
}

// ── Utilitaires géométriques ────────────────────────────────────────────────

function normal(fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number } {
  const dx = toX - fromX, dy = toY - fromY;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d === 0) return { x: 0, y: -1 };
  return { x: dx / d, y: dy / d };
}

/** Rebond sur une surface de normale n : inverse la composante normale si l'objet s'en approche. */
function reflect(o: { vx: number; vy: number }, nx: number, ny: number): void {
  deflect(o, nx, ny, 2);
}

/** Retire `factor` × la composante normale (choc élastique : factor = 2·m_cible / (m_tapeur + m_cible)). */
function deflect(o: { vx: number; vy: number }, nx: number, ny: number, factor: number): void {
  const dot = o.vx * nx + o.vy * ny;
  if (dot <= 0) return;
  o.vx -= factor * dot * nx;
  o.vy -= factor * dot * ny;
}

function capSpeed(b: Cat): void {
  const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  if (sp > MAX_BOULET_SPEED) {
    const k = MAX_BOULET_SPEED / sp;
    b.vx *= k;
    b.vy *= k;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ── Rejeu ────────────────────────────────────────────────────────────────────

export interface ReplayResult {
  state: SimState;
  valid: boolean; // faux si une entrée du journal est refusée par la sim
}

/** Rejoue un journal jusqu'à la fin de l'averse (borne de sécurité : 20 min de jeu). */
export function runReplay(averse: AverseDef, log: InputLog, maxTicks = 120 * 60 * 20): ReplayResult {
  const s = createSim(averse);
  let i = 0;
  let valid = true;
  for (let k = 1; k < log.length; k++) if (log[k].tick < log[k - 1].tick) valid = false;
  while (!s.ended && s.tick < maxTicks) {
    while (i < log.length && log[i].tick === s.tick) {
      if (tryShoot(s, log[i].angleDeci) !== 'ok') valid = false;
      i++;
    }
    if (i < log.length && log[i].tick < s.tick) { valid = false; i++; continue; }
    step(s);
    s.events.length = 0;
  }
  if (i < log.length || !s.ended) valid = false;
  return { state: s, valid };
}
