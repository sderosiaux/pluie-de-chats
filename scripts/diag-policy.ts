import { HANDMADE } from '../src/sim/averses/handmade';
import { createSim, step, tryShoot, finalScore, stars, CHARACTERS, catchableCount } from '../src/sim';
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
for (const a of HANDMADE) {
  const nm = [11,22,33,44,55].map(sd => finalScore(play(a, naiveBot(a, sd))));
  const mean = nm.reduce((p,q)=>p+q,0)/nm.length;
  const rows = [];
  for (const [m, e] of [[5,3],[6,3],[6,4],[7,4],[8,5]]) { const s = play(a, patient(a, m, e)); rows.push(`min${m}/esc${e}:${finalScore(s)}(${stars(s)}🐾,max${s.bestChain})`); }
  console.log(a.id, 'naive mean', mean.toFixed(1), '|', rows.join(' '));
}
