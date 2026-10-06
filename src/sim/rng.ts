// mulberry32 : uniquement des opérations entières 32 bits, identique partout.
// Sert à la génération des averses ; la simulation elle-même ne tire aucun aléa.

export interface Rng {
  next(): number; // [0, 1)
  int(lo: number, hi: number): number; // entier dans [lo, hi]
  range(lo: number, hi: number): number; // réel dans [lo, hi)
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    range: (lo, hi) => lo + next() * (hi - lo),
    pick: items => items[Math.floor(next() * items.length)],
  };
}
