import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY, emptyProgress, isNew, loadProgress, markRead, meet, mergeBest, mergeProgress, parseProgress, recordResult,
  saveProgress, seeCostume, serializeProgress, withSound,
} from './progress';
import type { Progress } from './progress';

function memoryStorage(init: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: k => m.get(k) ?? null,
    key: i => [...m.keys()][i] ?? null,
    removeItem: k => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

const sample = (): Progress => {
  let p = recordResult(emptyProgress(), '1-1', { stars: 2, score: 140, chain: 9 });
  p = recordResult(p, '1-2', { stars: 0, score: -5, chain: 1 });
  p = meet(meet(p, 'tigre'), 'gros');
  p = seeCostume(seeCostume(p, 'tigre', 'tabby'), 'tigre', 'eiffel');
  p = markRead(p, 'tigre');
  return withSound(p, false);
};

describe('progression : sérialisation', () => {
  it('aller-retour sans perte', () => {
    const p = sample();
    expect(parseProgress(serializeProgress(p))).toEqual(p);
  });

  it('la clé de stockage porte la version', () => {
    expect(STORAGE_KEY).toMatch(/v1$/);
    expect(JSON.parse(serializeProgress(emptyProgress())).v).toBe(1);
  });

  it.each([
    ['absent', null],
    ['vide', ''],
    ['JSON invalide', '{"v":1,'],
    ['pas un objet', '[1,2,3]'],
    ['nombre', '42'],
    ['null', 'null'],
    ['ancienne version', JSON.stringify({ v: 0, averses: { '1-1': { stars: 3, score: 1, chain: 1 } } })],
    ['version future', JSON.stringify({ v: 2, averses: {} })],
    ['sans version', JSON.stringify({ averses: { '1-1': { stars: 3, score: 1, chain: 1 } } })],
  ])('données %s → progression vide, sans exception', (_name, raw) => {
    expect(parseProgress(raw)).toEqual(emptyProgress());
  });

  it('écarte une à une les entrées invalides et garde les bonnes', () => {
    const raw = JSON.stringify({
      v: 1,
      averses: {
        '1-1': { stars: 1, score: 30, chain: 4 },
        '1-2': { stars: 4, score: 30, chain: 4 }, // pattes hors bornes
        '1-3': { stars: 1, score: 1.5, chain: 4 }, // score non entier
        '1-4': { stars: 1, score: 3, chain: -1 },
        '11-1': { stars: 1, score: 3, chain: 1 }, // chapitre inexistant
        'h1': { stars: 1, score: 3, chain: 1 }, // averse de débogage
        '2-1': 'oui',
        '__proto__': { stars: 3, score: 3, chain: 3 },
      },
      met: ['tigre', 'dragon', 'tigre', 7, 'gros'],
      read: ['gros', 'chaton'], // chaton jamais rencontré
      costumes: { tigre: ['tabby', '../../evil', 'tabby', 3], dragon: ['x'], gros: 'persan' },
      sound: 'non',
    });
    expect(parseProgress(raw)).toEqual({
      averses: { '1-1': { stars: 1, score: 30, chain: 4 } },
      met: ['tigre', 'gros'],
      read: ['gros'],
      costumes: { tigre: ['tabby'] },
      sound: true,
    });
  });
});

describe('progression : fusion', () => {
  it('garde le meilleur de chaque champ indépendamment', () => {
    expect(mergeBest({ stars: 3, score: 50, chain: 4 }, { stars: 1, score: 90, chain: 12 })).toEqual({ stars: 3, score: 90, chain: 12 });
    expect(mergeBest(undefined, { stars: 0, score: -5, chain: 0 })).toEqual({ stars: 0, score: -5, chain: 0 });
  });

  it('une averse rejouée moins bien ne fait rien perdre', () => {
    const p = recordResult(sample(), '1-1', { stars: 0, score: 3, chain: 1 });
    expect(p.averses['1-1']).toEqual({ stars: 2, score: 140, chain: 9 });
  });

  it("n'enregistre que les averses de campagne", () => {
    const p = emptyProgress();
    expect(recordResult(p, 'h1', { stars: 3, score: 1, chain: 1 })).toBe(p);
  });

  it('ne modifie jamais la progression reçue', () => {
    const p = sample();
    const before = serializeProgress(p);
    recordResult(p, '1-1', { stars: 3, score: 999, chain: 30 });
    meet(p, 'chaton');
    seeCostume(p, 'gros', 'persan');
    markRead(p, 'gros');
    withSound(p, true);
    expect(serializeProgress(p)).toBe(before);
  });

  it('carnet : rencontre, costumes, « nouveau » jusqu\'à la lecture de la page', () => {
    let p = meet(emptyProgress(), 'gros');
    expect(meet(p, 'gros')).toBe(p);
    expect(isNew(p, 'gros')).toBe(true);
    expect(isNew(p, 'chaton')).toBe(false);
    p = markRead(p, 'gros');
    expect(isNew(p, 'gros')).toBe(false);
    expect(markRead(p, 'chaton')).toBe(p); // jamais rencontré : rien à lire
    p = seeCostume(p, 'gros', 'persan');
    expect(seeCostume(p, 'gros', 'persan')).toBe(p);
    expect(p.costumes.gros).toEqual(['persan']);
  });
});

describe('progression : stockage', () => {
  it('relit ce qui a été écrit', () => {
    const s = memoryStorage();
    expect(saveProgress(s, sample())).toBe(true);
    expect(loadProgress(s)).toEqual(sample());
  });

  it('ignore une donnée corrompue', () => {
    expect(loadProgress(memoryStorage({ [STORAGE_KEY]: '\u0000garbage' }))).toEqual(emptyProgress());
  });

  it('survit à un stockage absent, inaccessible ou plein', () => {
    const broken = memoryStorage();
    broken.getItem = () => { throw new Error('SecurityError'); };
    broken.setItem = () => { throw new Error('QuotaExceededError'); };
    expect(loadProgress(null)).toEqual(emptyProgress());
    expect(loadProgress(broken)).toEqual(emptyProgress());
    expect(saveProgress(null, sample())).toBe(false);
    expect(saveProgress(broken, sample())).toBe(false);
  });
});

describe('deux onglets', () => {
  it('la fusion garde le meilleur de chacun, sans rien perdre', () => {
    const a = seeCostume(meet(recordResult(emptyProgress(), '1-1', { stars: 3, score: 120, chain: 6 }), 'gros'), 'gros', 'persan');
    const b = seeCostume(meet(recordResult(emptyProgress(), '1-2', { stars: 1, score: 40, chain: 3 }), 'chaton'), 'gros', 'hulk');
    const m = mergeProgress(a, recordResult(b, '1-1', { stars: 1, score: 200, chain: 2 }));
    expect(m.averses['1-1']).toEqual({ stars: 3, score: 200, chain: 6 });
    expect(m.averses['1-2']).toEqual({ stars: 1, score: 40, chain: 3 });
    expect(m.met).toEqual(['gros', 'chaton']);
    expect(m.costumes.gros).toEqual(['persan', 'hulk']);
  });

  it('un onglet périmé qui enregistre ne fait pas perdre les pattes de l’autre', () => {
    const s = memoryStorage();
    // Onglet B : 3 pattes sur 1-1, enregistrées.
    saveProgress(s, recordResult(emptyProgress(), '1-1', { stars: 3, score: 150, chain: 7 }));
    // Onglet A, chargé avant : il découvre un caractère et enregistre en fusionnant (comme commit()).
    const staleA = meet(emptyProgress(), 'tigre');
    saveProgress(s, mergeProgress(loadProgress(s), staleA));
    expect(loadProgress(s).averses['1-1']?.stars).toBe(3);
    expect(loadProgress(s).met).toContain('tigre');
  });
});

