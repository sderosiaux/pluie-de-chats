// GÉNÉRÉ par scripts/freeze-chapters.ts — ne pas éditer à la main.
// Graines validées : l'expert fait 3 pattes avec le stock de pelotes de chaque averse (GAME_SPEC §11).
import { generateAverse } from './generator';
import type { AverseDef } from '../types';

export const CAMPAIGN_SEEDS: Readonly<Record<string, number>> = {
  '1-1': 1012,
  '1-2': 1020,
  '1-3': 1034,
  '1-4': 1040,
  '1-5': 1055,
  '2-1': 2011,
  '2-2': 2024,
  '2-3': 2041,
  '2-4': 2041,
  '2-5': 2051,
  '3-1': 3016,
  '3-2': 3027,
  '3-3': 3034,
  '3-4': 3041,
  '3-5': 3054,
  '4-1': 4016,
  '4-2': 4022,
  '4-3': 4031,
  '4-4': 4047,
  '4-5': 4055,
  '5-1': 5012,
  '5-2': 5020,
  '5-3': 5031,
  '5-4': 5040,
  '5-5': 5052,
};

export function campaignAverse(chapter: number, index: number): AverseDef | undefined {
  const seed = CAMPAIGN_SEEDS[`${chapter}-${index}`];
  return seed === undefined ? undefined : generateAverse(chapter, index, seed);
}
