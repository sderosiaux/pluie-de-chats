// Porte P1 « chance / talent » (GAME_SPEC §29) : sur la même averse, le joueur qui lit le jeu
// doit faire au moins 2× le score de celui qui tire juste sur des chats au hasard.
// Si cette porte échoue, le classement mesurerait la chance : on s'arrête avant P3.

import { describe, expect, it } from 'vitest';
import { HANDMADE } from '../sim/averses/handmade';
import { finalScore, stars } from '../sim';
import { expertBot, naiveBot, playAverse } from './bots';

const NAIVE_SEEDS = [11, 22, 33, 44, 55];

describe('proxy chance / talent', () => {
  for (const averse of HANDMADE) {
    it(`${averse.id} : expert ≥ 2 × naïf (moyenne sur ${NAIVE_SEEDS.length} graines)`, () => {
      const expert = playAverse(averse, expertBot(averse));
      const naive = NAIVE_SEEDS.map(seed => playAverse(averse, naiveBot(averse, seed)));
      const e = finalScore(expert.state);
      const nScores = naive.map(r => finalScore(r.state));
      const nMean = nScores.reduce((a, b) => a + b, 0) / nScores.length;
      console.log(`[proxy] ${averse.id} expert=${e} (${stars(expert.state)}🐾, chaîne max ${expert.state.bestChain}, ${expert.state.caught} attrapés) `
        + `naïf=[${nScores.join(', ')}] moyenne=${nMean.toFixed(1)} ratio=${(e / Math.max(1, nMean)).toFixed(2)}`);
      expect(e).toBeGreaterThanOrEqual(2 * nMean);
    });
  }
});
