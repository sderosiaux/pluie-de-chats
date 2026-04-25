import { state, cats, upgradeFlags } from './state';
import { CAT_TYPES, OBJECT_TYPES } from './data';
import { CAT_SPAWN_Y } from './config';
import { CAT_SPRITES } from './sprites';
import type { Cat, CatType, ObjectType } from './types';

export function spawnInterval(): number {
  const base = Math.max(1.1, 3.2 - Math.min(state.gameTime / 150, 1) * 2.0);
  if (upgradeFlags.cheatMode) return 0.18;
  if (state.activeEvent && state.activeEvent.id === 'turbo') return base * 0.28;
  return base;
}

export function spawnCat(forcedType?: CatType): void {
  const type = forcedType || pickCatType();
  const s = Math.max(16, 22 * type.size);
  const margin = s + 8;
  let baseVy = 1.1 + Math.random() * .3 + Math.min(state.gameTime / 160 * 1.8, 2.5);
  if (state.activeEvent && state.activeEvent.id === 'turbo') baseVy *= 2.2;
  if (type.id === 'rapide') baseVy = Math.min(baseVy * 3, 12);
  if (type.id === 'boss')   baseVy = 1.6; // descend plus vite jusqu'à sa position

  const lines = ['miaou', 'ronron...', 'mew !', 'prrr~', 'mrrrow', 'nyaa~', '*bâille*', 'miaouuu', 'purr~', '... ?', 'miaou !'];
  const speech = Math.random() <= 0.07
    ? { text: lines[Math.floor(Math.random() * lines.length)], age: 0, dur: 2.2 + Math.random() * 1.2 }
    : null;

  const cat: Cat = {
    id: ++state._catIdCounter,
    x: margin + Math.random() * (state.W - margin * 2),
    y: CAT_SPAWN_Y - s,
    vx: type.id === 'boss' ? 0 : (Math.random() < .3 ? (Math.random() - .5) * 2.2 : 0),
    vy: baseVy,
    size: s, type, rot: 0,
    wobble: Math.random() * Math.PI * 2, wobbleSpd: .008 + Math.random() * .006,
    caught: false, catchAnim: 1,
    hp: type.id === 'boss' ? 8 : (type.hp || 1),
    maxHp: type.id === 'boss' ? 8 : (type.hp || 1),
    shieldFlash: 0,
    bossState: type.id === 'boss' ? 'entering' : null,
    bossAttackTimer: 0,
    bossAttackKind: 0,
    bossAnchorX: 0,
    bossWobble: Math.random() * Math.PI * 2,
    visible: true, visTimer: 1.2 + Math.random() * 0.6,
    spitTimer: type.id === 'crachat' ? 2.2 + Math.random() * 1.5 : 0,
    lucky: type.id !== 'boss' && Math.random() < (upgradeFlags.luckyRate || 0.05),
    spriteFlip: Math.random() < 0.5,
    spriteRot: (Math.random() - 0.5) * 0.32,
    poseIdx: CAT_SPRITES[type.id] ? Math.floor(Math.random() * CAT_SPRITES[type.id].length) : 0,
    spriteScale: 0.75 + Math.random() * 0.35,
    speech,
  };
  cats.push(cat);
}

export function pickObjectType(): ObjectType {
  const types = OBJECT_TYPES as ObjectType[];
  const total = types.reduce((s, t) => s + (t.w || 1), 0);
  let r = Math.random() * total;
  for (const t of types) {
    r -= (t.w || 1);
    if (r <= 0) return t;
  }
  return types[0];
}

export function spawnObject(): void {
  const type = pickObjectType();
  const s = 22 * type.size;
  const margin = s + 8;
  const cat: Cat = {
    id: ++state._catIdCounter,
    x: margin + Math.random() * (state.W - margin * 2),
    y: CAT_SPAWN_Y - s,
    vx: (Math.random() - .5) * 1.0,
    vy: type.baseVy + Math.random() * .25,
    size: s, type, rot: 0,
    wobble: Math.random() * Math.PI * 2, wobbleSpd: .006,
    caught: false, catchAnim: 1,
    isObject: true,
    hp: 1, maxHp: 1, shieldFlash: 0,
    bossState: null, bossAttackTimer: 0, bossAttackKind: 0, bossAnchorX: 0, bossWobble: 0,
    visible: true, visTimer: 999, spitTimer: 0, lucky: false,
    spriteFlip: false, spriteRot: 0, poseIdx: 0, spriteScale: 1, speech: null,
  };
  cats.push(cat);
}

export function pickCatType(forceRare?: boolean): CatType {
  const types = CAT_TYPES as CatType[];
  let pool = types.filter(t => t.minLvl <= state.level && t.w > 0);
  if (forceRare || (state.activeEvent && state.activeEvent.id === 'rares')) {
    const rare = pool.filter(t => ['fantome', 'astro', 'rainbow'].includes(t.id));
    if (rare.length) pool = rare;
  }
  const total = pool.reduce((s, t) => s + t.w, 0);
  let r = Math.random() * total;
  for (const t of pool) {
    r -= t.w;
    if (r <= 0) return t;
  }
  return pool[0];
}
