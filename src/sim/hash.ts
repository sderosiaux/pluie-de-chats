// Empreinte bit-exacte d'un état : FNV-1a 32 bits sur les octets Float64 d'une liste canonique de champs.
// Deux moteurs qui donnent le même hash ont calculé exactement les mêmes nombres.

import type { CatState, SimState } from './types';

const ST_CODE: Record<CatState, number> = { fall: 1, boulet: 2, gone: 3 };

export function hashState(s: SimState): string {
  const nums: number[] = [
    s.tick, s.nextSpawn, s.nextId, s.pelotes, s.cooldown, s.score, s.caught, s.missed, s.dogsHit, s.bestChain,
    s.ended ? 1 : 0, s.cats.length, s.balls.length, s.chains.length,
  ];
  for (const c of s.cats) {
    nums.push(c.id, ST_CODE[c.st], c.x, c.y, c.anchorX, c.vx, c.vy, c.age, c.leapVx, c.leapCd, c.shield ? 1 : 0, c.life, c.chainId, c.escortOf);
  }
  for (const b of s.balls) nums.push(b.id, b.x, b.y, b.vx, b.vy, b.bounces);
  for (const ch of s.chains) nums.push(ch.id, ch.n, ch.alive);

  const view = new DataView(new ArrayBuffer(8));
  let h = 0x811c9dc5;
  for (const v of nums) {
    view.setFloat64(0, v);
    for (let i = 0; i < 8; i++) {
      h ^= view.getUint8(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
