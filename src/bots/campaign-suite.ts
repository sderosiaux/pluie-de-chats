// Portes de la campagne figée (GAME_SPEC §11, §27, §29), un fichier de test par chapitre pour paralléliser
// (un seul fichier de ~2 min faisait expirer le canal interne de Vitest et sortir en échec malgré des tests verts).
import { describe, expect, it } from 'vitest';
import { CAMPAIGN_SEEDS, campaignAverse } from '../sim/averses/chapters';
import { finalScore, stars } from '../sim';
import { expertBot, naiveBot, playAverse } from './bots';

const NAIVE_SEEDS = [11, 22, 33, 44, 55];

export function campaignSuite(chapter: number): void {
  const ids = Object.keys(CAMPAIGN_SEEDS).filter(id => id.startsWith(`${chapter}-`));
  describe(`campagne, chapitre ${chapter}`, () => {
    it('le chapitre est figé (5 averses)', () => expect(ids).toHaveLength(5));
    for (const id of ids) {
      const index = Number(id.split('-')[1]);
      const tutorial = chapter === 1 && index === 1;
      it(`${id} : l'expert fait 3 🐾 ; ${tutorial ? 'tout débutant fait au moins 1 🐾' : 'expert > 2 × naïf'}`, () => {
        const averse = campaignAverse(chapter, index)!;
        const expert = playAverse(averse, expertBot(averse)).state;
        expect(stars(expert)).toBe(3);
        const naive = NAIVE_SEEDS.map(seed => playAverse(averse, naiveBot(averse, seed)).state);
        if (tutorial) {
          for (const n of naive) expect(stars(n)).toBeGreaterThanOrEqual(1);
          return;
        }
        const mean = naive.reduce((a, n) => a + finalScore(n), 0) / naive.length;
        console.log(`[proxy] ${id} expert=${finalScore(expert)} naïf=[${naive.map(finalScore).join(', ')}] ratio=${(finalScore(expert) / Math.max(1, mean)).toFixed(2)}`);
        expect(finalScore(expert)).toBeGreaterThan(2 * mean);
      });
    }
  });
}
