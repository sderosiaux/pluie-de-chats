import type { CharacterId } from './types';

// GAME_SPEC §8 « Costumes → caractères ». Un costume ne porte qu'un caractère par averse :
// siamois sert de tigré avant le chapitre 5, puis de trouillard (géré par `costumesFor`).
const BASE: Readonly<Record<CharacterId, readonly string[]>> = {
  tigre: ['tabby', 'noir', 'blanc', 'gris', 'sphynx', 'scottish', 'bengal', 'boulanger', 'cuisinier', 'facteur',
    'jardinier', 'artiste', 'musicien', 'marin', 'professeur', 'infirmier', 'gamer', 'clown', 'sportif', 'cowboy', 'policier'],
  gros: ['persan', 'parrain', 'garde', 'hulk', 'viking', 'moai', 'boss'],
  chaton: ['micro'],
  chien: ['faux'],
  trouillard: ['ninja', 'catwoman', 'detective', 'magicien'],
  bouclier: ['bouclier', 'chevalier', 'robot', 'samourai'],
  fusee: ['astro', 'flash', 'superman', 'rapide'],
  elastique: ['rainbow', 'zigzag', 'spiderman', 'pirate'],
  fantome: ['fantome', 'furtif', 'sorciere'],
  maman: ['medecin', 'pompier'],
};

/** Costumes rares de tigré (§8) : 2 % après le chapitre 3, sans effet de jeu. */
export const RARE_TIGRE_COSTUMES: readonly string[] = ['liberte', 'eiffel', 'pagode', 'sphinx', 'trafiquant', 'scientifique', 'batman', 'tireur'];

export function costumesFor(char: CharacterId, chapter: number): readonly string[] {
  if (char === 'tigre' && chapter < 5) return [...BASE.tigre, 'siamois'];
  if (char === 'trouillard' && chapter >= 5) return [...BASE.trouillard, 'siamois'];
  return BASE[char];
}
