// Porte P1 « ligne de visée » (§13) : depuis un état où le joueur PEUT tirer, la prédiction annonce
// exactement ce que fait le vrai tir. Le « vrai » tir est joué sur une copie exacte de l'état, sans rien
// forcer (ni recharge ni stock), et on observe ce qui arrive à la pelote et au chat annoncé.

import { describe, expect, it } from 'vitest';
import { HANDMADE } from './averses/handmade';
import { LAUNCH_X } from './constants';
import { cloneSim, createSim, predictFirstContact, step, tryShoot } from './index';
import type { AverseDef, CharacterId, Prediction, SimState } from './types';

interface Outcome { kind: Prediction['kind']; catId: number; dodges: number[]; catBecameBoulet: boolean }

function fire(s: SimState, angleDeci: number): Outcome {
  const sim = cloneSim(s);
  expect(tryShoot(sim, angleDeci)).toBe('ok');
  const ballId = sim.nextId - 1;
  const dodges: number[] = [];
  let first: { kind: Prediction['kind']; catId: number } | null = null;
  for (let t = 0; t < 120 && !first; t++) {
    step(sim);
    for (const e of sim.events) {
      if (first) break;
      if (e.type === 'dodge' && e.ballId === ballId) dodges.push(e.catId);
      else if ((e.type === 'catch' || e.type === 'dog' || e.type === 'shield') && e.ballId === ballId) first = { kind: e.type, catId: e.catId };
      else if (e.type === 'ballLost' && e.ballId === ballId) first = { kind: 'none', catId: -1 };
    }
    sim.events.length = 0;
  }
  const f = first ?? { kind: 'none' as const, catId: -1 };
  const cat = sim.cats.find(c => c.id === f.catId);
  return { ...f, dodges, catBecameBoulet: cat?.st === 'boulet' };
}

function check(s: SimState, angleDeci: number, seen: Set<string>): void {
  expect(s.cooldown).toBe(0);
  expect(s.pelotes).toBeGreaterThan(0);
  const p = predictFirstContact(s, angleDeci)!;
  const real = fire(s, angleDeci);
  expect(p.kind).toBe(real.kind);
  expect(p.catId).toBe(real.catId);
  expect(p.dodges).toEqual(real.dodges);
  if (p.kind === 'catch') expect(real.catBecameBoulet).toBe(true);
  seen.add(p.kind);
  if (p.dodges.length) seen.add('dodge');
}

function lone(char: CharacterId, x: number, waitTicks: number, pelotes = 3): SimState {
  const a: AverseDef = { id: 'p', chapter: 6, pelotes, spawns: [{ tick: 0, char, costume: 'x', x, swayAmp: 0, swayPhase: 0 }] };
  const s = createSim(a);
  for (let i = 0; i < waitTicks; i++) { step(s); s.events.length = 0; }
  return s;
}

describe('ligne de visée', () => {
  it('averses à la main : prédit = réel sur 20 situations, dans les trois averses', () => {
    const seen = new Set<string>();
    let situations = 0;
    for (const averse of HANDMADE) {
      const s = createSim(averse);
      let here = 0;
      while (!s.ended && here < 7) {
        step(s);
        s.events.length = 0;
        if (s.tick % 300 !== 0 || !s.cats.some(c => c.st === 'fall' && c.y > 80)) continue;
        for (const a of [300, 600, 800, 880, 900, 920, 1000, 1200, 1500]) check(s, a, seen);
        here++;
      }
      expect(here).toBeGreaterThan(0);
      situations += here;
    }
    expect(situations).toBeGreaterThanOrEqual(20);
    expect(seen.has('catch')).toBe(true);
    expect(seen.has('none')).toBe(true);
  });

  it('cas construits : chien, bouclier rasant, trouillard qui esquive', () => {
    const seen = new Set<string>();
    check(lone('chien', LAUNCH_X, 300), 900, seen);
    check(lone('bouclier', LAUNCH_X - 26, 250), 900, seen); // choc rasant (régression B1)
    check(lone('bouclier', LAUNCH_X, 300), 900, seen);
    check(lone('trouillard', LAUNCH_X, 300), 900, seen);
    expect([...seen].sort()).toEqual(expect.arrayContaining(['dog', 'shield', 'dodge']));
  });
});
