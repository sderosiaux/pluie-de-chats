import { HANDMADE } from '../src/sim/averses/handmade';
import { createSim, step, tryShoot, finalScore, stars, CHARACTERS } from '../src/sim';
import { evaluateShot, naiveBot, type Bot } from '../src/bots/bots';
import { ANGLE_MAX, ANGLE_MIN } from '../src/sim';
import type { AverseDef, SimState } from '../src/sim';
const C: number[] = []; for (let a = ANGLE_MIN; a <= ANGLE_MAX; a += 25) C.push(a);
function patient(a: AverseDef, minN: number, escapeN: number): Bot {
  const last = a.spawns[a.spawns.length - 1].tick;
  return (s: SimState) => {
    if (s.tick % 10) return null;
    let bA = -1, bN = 0, bV = -Infinity;
    for (const x of C) { const r = evaluateShot(s, x); if (r.value > bV) { bV = r.value; bN = r.n; bA = x; } }
    if (bA < 0 || bV <= 0) return null;
    const escaping = s.cats.some(c => c.st === 'fall' && CHARACTERS[c.char].catchable && c.y > 520);
    if (bN >= minN || (escaping && bN >= escapeN) || (s.tick > last + 240 && bN >= 1 && s.pelotes > 1)) return bA;
    return null;
  };
}
function play(a: AverseDef, bot: Bot) { const s = createSim(a); while (!s.ended) { if (s.cooldown === 0 && s.pelotes > 0) { const x = bot(s); if (x !== null) tryShoot(s, x); } step(s); s.events.length = 0; } return s; }
const out: string[] = [];
for (const a of HANDMADE) {
  const nm = [11,22,33,44,55].map(sd => play(a, naiveBot(a, sd)));
  const ns = nm.map(finalScore); const mean = ns.reduce((p,q)=>p+q,0)/ns.length;
  const e6 = play(a, patient(a, 6, 3)), e8 = play(a, patient(a, 8, 5));
  out.push(`${a.id} naive=[${ns.join(',')}] mean=${mean.toFixed(0)} naiveStars=[${nm.map(stars).join('')}] | e6=${finalScore(e6)} r=${(finalScore(e6)/mean).toFixed(2)} ${stars(e6)}🐾 max${e6.bestChain} | e8=${finalScore(e8)} r=${(finalScore(e8)/mean).toFixed(2)} ${stars(e8)}🐾 max${e8.bestChain}`);
}
console.log(out.join('\n'));
