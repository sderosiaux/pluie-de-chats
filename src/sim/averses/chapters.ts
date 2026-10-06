// GÉNÉRÉ par scripts/freeze-chapters.ts — ne pas éditer à la main.
// Graines validées : l'expert fait 3 pattes avec le stock de pelotes de chaque averse (GAME_SPEC §11).
import { generateAverse } from './generator';
import type { AverseDef } from '../types';

export const CAMPAIGN_SEEDS: Readonly<Record<string, number>> = {
  '1-1': 1010,
  '1-2': 1026,
  '1-3': 1032,
  '1-4': 1040,
  '1-5': 1063,
  '2-1': 2011,
  '2-2': 2020,
  '2-3': 2038,
  '2-4': 2041,
  '2-5': 2051,
  '3-1': 3016,
  '3-2': 3020,
  '3-3': 3032,
  '3-4': 3040,
  '3-5': 3053,
  '4-1': 4020,
  '4-2': 4022,
  '4-3': 4031,
  '4-4': 4047,
  '4-5': 4051,
  '5-1': 5011,
  '5-2': 5022,
  '5-3': 5031,
  '5-4': 5040,
  '5-5': 5051,
};

export function campaignAverse(chapter: number, index: number): AverseDef | undefined {
  const seed = CAMPAIGN_SEEDS[`${chapter}-${index}`];
  return seed === undefined ? undefined : generateAverse(chapter, index, seed);
}
