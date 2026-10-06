// Structure des averses de la campagne (GAME_SPEC §10, §11, §13), indépendamment des valeurs des graines.
import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../characters';
import { CAMPAIGN_SEEDS } from './chapters';
import { generateAverse } from './generator';
import type { Kind } from './generator';
import { averseFingerprint, structureProblems } from './structure';
import { CAMPAIGN_FINGERPRINTS } from './fingerprints';

describe('averses de la campagne : structure §10–§13', () => {
  for (const [id, seed] of Object.entries(CAMPAIGN_SEEDS)) {
    it(`${id} : densité croissante, pas de trou > 9 s, costumes uniques, nouveau caractère tôt, Grande averse complète`, () => {
      const [chapter, index] = id.split('-').map(Number);
      const trace: Kind[] = [];
      const averse = generateAverse(chapter, index, seed, trace);
      expect(structureProblems(chapter, index, averse, trace)).toEqual([]);
    });
    it(`${id} : identique à l'averse validée au gel (empreinte)`, () => {
      const [chapter, index] = id.split('-').map(Number);
      expect(averseFingerprint(generateAverse(chapter, index, seed))).toBe(CAMPAIGN_FINGERPRINTS[id]);
    });
  }
});

describe('campagne : averses toutes différentes', () => {
  it('aucune averse n’a le même contenu qu’une autre (à l’id près)', () => {
    const contents = Object.entries(CAMPAIGN_SEEDS).map(([id, seed]) => {
      const [c, i] = id.split('-').map(Number);
      return averseFingerprint({ ...generateAverse(c, i, seed), id: '' });
    });
    expect(new Set(contents).size).toBe(contents.length);
  });
});

describe('vitesses de chute', () => {
  it('toutes à ±20 % du tigré (§13)', () => {
    const ref = CHARACTERS.tigre.fallSpeed;
    for (const c of Object.values(CHARACTERS)) {
      expect(c.fallSpeed).toBeGreaterThanOrEqual(ref * 0.8);
      expect(c.fallSpeed).toBeLessThanOrEqual(ref * 1.2);
    }
  });
});
