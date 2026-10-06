import { HANDMADE } from '../src/sim/averses/handmade';
import { createSim, step, tryShoot, finalScore } from '../src/sim';
import { expertBot, naiveBot, type Bot } from '../src/bots/bots';
import type { AverseDef } from '../src/sim';

function play(a: AverseDef, bot: Bot) {
  const s = createSim(a); const chains: number[] = []; let shots = 0;
  while (!s.ended) {
    if (s.cooldown === 0 && s.pelotes > 0) { const ang = bot(s); if (ang !== null && tryShoot(s, ang) === 'ok') shots++; }
    step(s);
    for (const e of s.events) if (e.type === 'chainEnd') chains.push(e.n);
    s.events.length = 0;
  }
  return { score: finalScore(s), chains, shots, caught: s.caught, missed: s.missed, pel: s.pelotes };
}
for (const a of HANDMADE) {
  console.log(a.id, 'cats', a.spawns.length);
  console.log('  expert', JSON.stringify(play(a, expertBot(a))));
  for (const seed of [11, 22, 33]) console.log('  naive', seed, JSON.stringify(play(a, naiveBot(a, seed))));
}
