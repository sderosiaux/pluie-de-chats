// Porte P1 « ligne de visée » (§13) : le premier contact prédit est exactement le premier contact réel.
import { describe, expect, it } from 'vitest';
import { HANDMADE } from './averses/handmade';
import { cloneSim, createSim, predictFirstContact, step, tryShoot } from './index';
import type { SimState } from './types';

function realFirstContact(s: SimState, angleDeci: number) {
  const sim = cloneSim(s);
  sim.cooldown = 0;
  if (sim.pelotes < 1) sim.pelotes = 1;
  expect(tryShoot(sim, angleDeci)).toBe('ok');
  const ballId = sim.nextId - 1;
  for (let t = 0; t < 120; t++) {
    step(sim);
    for (const e of sim.events) {
      if ((e.type === 'catch' || e.type === 'dog' || e.type === 'shield') && e.ballId === ballId) return { kind: e.type, catId: e.catId };
      if (e.type === 'ballLost' && e.ballId === ballId) return { kind: 'none', catId: -1 };
    }
    sim.events.length = 0;
  }
  return { kind: 'none', catId: -1 };
}

describe('ligne de visée', () => {
  it('20 tirs : contact prédit = contact réel (type et chat)', () => {
    let checked = 0, contacts = 0;
    for (const averse of HANDMADE) {
      const s = createSim(averse);
      const angles = [300, 500, 700, 850, 900, 950, 1100, 1300, 1500];
      while (!s.ended && checked < 20) {
        step(s);
        s.events.length = 0;
        if (s.tick % 400 !== 0 || !s.cats.some(c => c.st === 'fall')) continue;
        for (const a of angles) {
          const p = predictFirstContact(s, a)!;
          const r = realFirstContact(s, a);
          expect(p.kind).toBe(r.kind);
          expect(p.catId).toBe(r.catId);
          if (r.kind !== 'none') contacts++;
        }
        checked++;
      }
    }
    expect(checked).toBe(20);
    expect(contacts).toBeGreaterThan(20); // le test porte bien sur des contacts, pas seulement des tirs perdus
  });
});
