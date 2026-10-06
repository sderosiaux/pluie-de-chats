// Cherche, pour chaque averse de la campagne, la première graine dont l'averse générée est jouable
// à 3 pattes par l'expert (≥ 90 %, GAME_SPEC §11), puis fige les graines dans src/sim/averses/chapters.ts.
// Usage : npm run freeze-chapters -- <chapitreMax>   (P2 : 5, P4 : 10)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateAverse, averseId, AVERSES_PER_CHAPTER } from '../src/sim/averses/generator';
import type { Kind } from '../src/sim/averses/generator';
import { averseFingerprint, structureProblems } from '../src/sim/averses/structure';
import { writeFingerprints } from './lib/fingerprints';
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

const maxChapter = Number(process.argv[2] ?? 10);
if (!Number.isInteger(maxChapter) || maxChapter < 1 || maxChapter > 10) throw new Error('usage : freeze-chapters <chapitreMax 1–10>');
// Le fichier est réécrit entièrement : figer moins de chapitres qu'avant les retirerait de la campagne.
console.log(`Gel des chapitres 1 à ${maxChapter} (les chapitres au-delà ne seront plus jouables).`);
const seeds: Record<string, number> = {};
// Empreintes du contenu (sans l'id) des averses retenues : deux cases ne peuvent pas porter la même averse.
const taken = new Set<string>();
for (let ch = 1; ch <= maxChapter; ch++) {
  for (let i = 1; i <= AVERSES_PER_CHAPTER; i++) {
    let seed = ch * 1000 + i * 10;
    for (let tries = 0; ; tries++) {
      if (tries > 120) throw new Error(`aucune graine valide pour ${averseId(ch, i)}`);
      const trace: Kind[] = [];
      const a = generateAverse(ch, i, seed, trace);
      // Structure d'abord (gratuite à vérifier), puis faisabilité et part du talent (simulation).
      const content = averseFingerprint({ ...a, id: '' });
      if (taken.has(content) || structureProblems(ch, i, a, trace).length) { seed++; continue; }
      const r = playAverse(a, expertBot(a));
      const tutorial = ch === 1 && i === 1;
      const ratio = stars(r.state) === 3 ? skillRatio(a, finalScore(r.state)) : 0;
      // Tutoriel : un débutant (le naïf) doit faire au moins 1 patte, quelle que soit sa graine (§27).
      const beginnerOk = !tutorial || NAIVE_SEEDS.every(sd => stars(playAverse(a, naiveBot(a, sd)).state) >= 1);
      if (stars(r.state) === 3 && beginnerOk && (tutorial || ratio > 2.2)) {
        seeds[averseId(ch, i)] = seed;
        taken.add(content);
        console.log(`${a.id} graine=${seed} essais=${tries + 1} chats=${a.spawns.length} pelotes=${a.pelotes} expert=${finalScore(r.state)} max=${r.state.bestChain} ratio=${ratio.toFixed(2)}`);
        break;
      }
      seed++;
    }
  }
}
const body = Object.entries(seeds).map(([k, v]) => `  '${k}': ${v},`).join('\n');
writeFileSync(fileURLToPath(new URL('../src/sim/averses/chapters.ts', import.meta.url)), `// GÉNÉRÉ par scripts/freeze-chapters.ts — ne pas éditer à la main.
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
writeFingerprints(seeds);
