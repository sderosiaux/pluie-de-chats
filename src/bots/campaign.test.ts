// Portes P2/P4 (GAME_SPEC §11, §29) sur les averses figées de la campagne :
// - chaque averse est jouable à 3 pattes avec son stock de pelotes (validateur glouton) ;
// - sur la Grande averse de chaque chapitre, le talent compte : expert > 2 × naïf.
// Si la physique ou le générateur change, relancer `npm run freeze-chapters -- <chapitreMax>`.

import { describe, expect, it } from 'vitest';
import { CAMPAIGN_SEEDS, campaignAverse } from '../sim/averses/chapters';
import { finalScore, stars } from '../sim';
import { expertBot, naiveBot, playAverse } from './bots';

const ids = Object.keys(CAMPAIGN_SEEDS);
const NAIVE_SEEDS = [11, 22, 33, 44, 55];

function parse(id: string): [number, number] {
  const [c, i] = id.split('-').map(Number);
  return [c, i];
}

describe('campagne : 3 pattes atteignables', () => {
  for (const id of ids) {
    it(`${id} : l'expert fait 3 🐾`, () => {
      const averse = campaignAverse(...parse(id))!;
      expect(stars(playAverse(averse, expertBot(averse)).state)).toBe(3);
    });
  }
});

describe('campagne : chance / talent (toutes les averses hors tutoriel 1-1)', () => {
  for (const id of ids.filter(k => k !== '1-1')) {
    it(`${id} : expert > 2 × naïf`, () => {
      const averse = campaignAverse(...parse(id))!;
      const e = finalScore(playAverse(averse, expertBot(averse)).state);
      const n = NAIVE_SEEDS.map(seed => finalScore(playAverse(averse, naiveBot(averse, seed)).state));
      const mean = n.reduce((a, b) => a + b, 0) / n.length;
      console.log(`[proxy] ${id} expert=${e} naïf=[${n.join(', ')}] ratio=${(e / Math.max(1, mean)).toFixed(2)}`);
      expect(e).toBeGreaterThan(2 * mean);
    });
  }
});
