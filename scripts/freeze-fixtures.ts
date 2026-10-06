// Fige 3 journaux de parties (expert sur h1–h3) et le hash de l'état final calculé sous Node.
// À relancer volontairement (`npm run fixtures`) quand la physique change : le test de déterminisme
// et le test cross-engine (P3) comparent à ces valeurs.
import { writeFileSync } from 'node:fs';
import { HANDMADE } from '../src/sim/averses/handmade';
import { hashState, runReplay, finalScore } from '../src/sim';
import { expertBot, playAverse } from '../src/bots/bots';

const out = HANDMADE.map(a => {
  const { log } = playAverse(a, expertBot(a));
  const r = runReplay(a, log);
  if (!r.valid) throw new Error(`journal invalide pour ${a.id}`);
  return { averseId: a.id, log, hash: hashState(r.state), score: finalScore(r.state) };
});
writeFileSync('src/sim/fixtures/replays.json', JSON.stringify(out, null, 1) + '\n');
console.log(out.map(o => `${o.averseId} ${o.log.length} tirs score=${o.score} hash=${o.hash}`).join('\n'));
