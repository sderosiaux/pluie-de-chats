import { describe, expect, it } from 'vitest';
import { campaignAverse } from '../sim/averses/chapters';
import { RARE_TIGRE_COSTUMES } from '../sim/costumes';
import {
  RARE_RATE, allSlots, averseFor, isGrande, isPlayable, isUnlocked, nextSlot, parseSlot, rareCostume,
  rareCostumesEnabled, rareCostumesFor, slotId, suggestedSlot,
} from './campaign';
import { emptyProgress, recordResult } from './progress';
import type { Progress } from './progress';

const withStars = (entries: Array<[string, 0 | 1 | 2 | 3]>): Progress =>
  entries.reduce((p, [id, stars]) => recordResult(p, id, { stars, score: 0, chain: 0 }), emptyProgress());

const s = (id: string) => {
  const slot = parseSlot(id);
  if (!slot) throw new Error(id);
  return slot;
};

describe('campagne : déblocage (§10)', () => {
  it('au départ, seule 1-1 est ouverte', () => {
    const p = emptyProgress();
    expect(allSlots().filter(x => isUnlocked(p, x)).map(slotId)).toEqual(['1-1']);
  });

  it('N+1 se débloque dès 1 patte sur N, pas avant', () => {
    expect(isUnlocked(withStars([['1-1', 0]]), s('1-2'))).toBe(false);
    expect(isUnlocked(withStars([['1-1', 1]]), s('1-2'))).toBe(true);
    expect(isUnlocked(withStars([['1-1', 1]]), s('1-3'))).toBe(false);
  });

  it('le chapitre suivant se débloque par sa Grande averse seulement', () => {
    expect(isUnlocked(withStars([['1-4', 3]]), s('2-1'))).toBe(false);
    expect(isUnlocked(withStars([['1-5', 1]]), s('2-1'))).toBe(true);
  });

  it('les 3 pattes ne bloquent jamais', () => {
    const p = withStars([['1-1', 1], ['1-2', 1], ['1-3', 1], ['1-4', 1], ['1-5', 1]]);
    expect(isUnlocked(p, s('2-1'))).toBe(true);
  });

  it('une averse sans graine reste injouable même débloquée', () => {
    const p = withStars([['5-5', 1]]);
    expect(isUnlocked(p, s('6-1'))).toBe(true);
    expect(isPlayable(p, s('6-1'))).toBe(averseFor(s('6-1')) !== undefined);
  });

  it("l'averse proposée est la première jouable sans patte", () => {
    expect(suggestedSlot(emptyProgress())).toEqual(s('1-1'));
    expect(suggestedSlot(withStars([['1-1', 2]]))).toEqual(s('1-2'));
  });
});

describe('campagne : structure', () => {
  it('10 chapitres × 5 averses, la 5ᵉ est la Grande averse', () => {
    expect(allSlots()).toHaveLength(50);
    expect(allSlots().filter(isGrande).map(slotId)).toEqual(['1-5', '2-5', '3-5', '4-5', '5-5', '6-5', '7-5', '8-5', '9-5', '10-5']);
  });

  it('averse suivante, chapitre suivant, fin de campagne', () => {
    expect(nextSlot(s('1-4'))).toEqual(s('1-5'));
    expect(nextSlot(s('1-5'))).toEqual(s('2-1'));
    expect(nextSlot(s('10-5'))).toBeNull();
  });

  it('ids : seules les averses de campagne sont reconnues', () => {
    for (const bad of ['h1', '0-1', '1-0', '1-6', '11-1', '1-1x', ' 1-1', '']) expect(parseSlot(bad)).toBeNull();
    expect(parseSlot('10-5')).toEqual({ chapter: 10, index: 5 });
  });

  it('averseFor renvoie la même averse que le module figé, mémoïsée', () => {
    const a = averseFor(s('1-1'));
    expect(a?.id).toBe(campaignAverse(1, 1)?.id);
    expect(averseFor(s('1-1'))).toBe(a);
  });
});

describe('campagne : costumes rares (§8)', () => {
  it('apparaissent une fois le chapitre 3 passé', () => {
    expect(rareCostumesEnabled(withStars([['3-4', 3]]))).toBe(false);
    expect(rareCostumesEnabled(withStars([['3-5', 1]]))).toBe(true);
  });

  it('figés : une valeur connue ne change pas d’une version à l’autre (le joueur garde ses costumes vus)', () => {
    expect(rareCostume('2-3', 0)).toBeNull();
    expect(rareCostume('2-3', 13)).toBe('eiffel');
    expect(rareCostume('2-3', 44)).toBe('sphinx');
    expect(rareCostume('2-3', 59)).toBe('liberte');
    expect(rareCostume('2-3', 79)).toBe('tireur');
  });

  it('environ un tigré sur 50, tous les costumes rares possibles', () => {
    const seen = new Set<string>();
    let hits = 0;
    const n = 20000;
    for (let ch = 1; ch <= 10; ch++) {
      for (let k = 1; k <= 5; k++) {
        for (let i = 0; i < n / 50; i++) {
          const c = rareCostume(`${ch}-${k}`, i);
          if (c) { hits++; seen.add(c); }
        }
      }
    }
    expect(hits / n).toBeGreaterThan(0.6 / RARE_RATE);
    expect(hits / n).toBeLessThan(1.4 / RARE_RATE);
    expect([...seen].sort()).toEqual([...RARE_TIGRE_COSTUMES].sort());
  });

  it("ne touchent que les tigrés, et rien tant qu'ils sont verrouillés", () => {
    for (const slot of allSlots()) {
      const a = averseFor(slot);
      if (!a) continue;
      expect(rareCostumesFor(a, false).size).toBe(0);
      for (const [i, c] of rareCostumesFor(a, true)) {
        expect(a.spawns[i].char).toBe('tigre');
        expect(RARE_TIGRE_COSTUMES).toContain(c);
      }
    }
  });
});
