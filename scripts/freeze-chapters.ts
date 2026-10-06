// Cherche, pour chaque averse de la campagne, la première graine dont l'averse générée est jouable
// à 3 pattes par l'expert (≥ 90 %, GAME_SPEC §11), puis fige les graines dans src/sim/averses/chapters.ts.
// Usage : npm run freeze-chapters -- <chapitreMax>   (P2 : 5, P4 : 10)
import { writeFileSync } from 'node:fs';
import { generateAverse, averseId, AVERSES_PER_CHAPTER } from '../src/sim/averses/generator';
import { stars, finalScore } from '../src/sim';
import { expertBot, naiveBot, playAverse } from '../src/bots/bots';

// Une graine n'est retenue que si l'averse est faisable (3 pattes pour l'expert) ET si le talent y
// compte (expert > 2,2 × moyenne du naïf, marge au-dessus de la porte des 2×, §29). Le tutoriel 1-1
// est exempté de la seconde condition (décision du 2026-10-05).
const NAIVE_SEEDS = [11, 22, 33, 44, 55];
function skillRatio(a: Parameters<typeof playAverse>[0], expertScore: number): number {
  const n = NAIVE_SEEDS.map(sd => finalScore(playAverse(a, naiveBot(a, sd)).state));
  return expertScore / Math.max(1, n.reduce((p, q) => p + q, 0) / n.length);
}

const maxChapter = Number(process.argv[2] ?? 5);
const seeds: Record<string, number> = {};
for (let ch = 1; ch <= maxChapter; ch++) {
  for (let i = 1; i <= AVERSES_PER_CHAPTER; i++) {
    let seed = ch * 1000 + i * 10;
    for (let tries = 0; ; tries++) {
      if (tries > 60) throw new Error(`aucune graine valide pour ${averseId(ch, i)}`);
      const a = generateAverse(ch, i, seed);
      const r = playAverse(a, expertBot(a));
      const tutorial = ch === 1 && i === 1;
      const ratio = stars(r.state) === 3 ? skillRatio(a, finalScore(r.state)) : 0;
      if (stars(r.state) === 3 && (tutorial || ratio > 2.2)) {
        seeds[averseId(ch, i)] = seed;
        console.log(`${a.id} graine=${seed} essais=${tries + 1} chats=${a.spawns.length} pelotes=${a.pelotes} expert=${finalScore(r.state)} max=${r.state.bestChain} ratio=${ratio.toFixed(2)}`);
        break;
      }
      seed++;
    }
  }
}
const body = Object.entries(seeds).map(([k, v]) => `  '${k}': ${v},`).join('\n');
writeFileSync('src/sim/averses/chapters.ts', `// GÉNÉRÉ par scripts/freeze-chapters.ts — ne pas éditer à la main.
// Graines validées : l'expert fait 3 pattes avec le stock de pelotes de chaque averse (GAME_SPEC §11).
import { generateAverse } from './generator';
import type { AverseDef } from '../types';

export const CAMPAIGN_SEEDS: Readonly<Record<string, number>> = {
${body}
};

export function campaignAverse(chapter: number, index: number): AverseDef | undefined {
  const seed = CAMPAIGN_SEEDS[\`\${chapter}-\${index}\`];
  return seed === undefined ? undefined : generateAverse(chapter, index, seed);
}
`);
