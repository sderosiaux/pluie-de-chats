// Trois averses écrites à la main pour P1 (GAME_SPEC §12 : 1-1, 2-1, 4-2).
// Elles servent au prototype et aux portes « déterminisme » et « chance / talent ».

import { assemble, colonne, grappe, pluieFine, rideau, seconds, vForm } from '../formations';
import { createRng } from '../rng';
import type { AverseDef, CharacterId } from '../types';

// Hors tutoriel, grappes espacées comme dans la campagne (generator.ts) : la chaîne dépend de l'angle.
const LOOSE_X = 50;
const LOOSE_Y = 48;

const T: CharacterId = 'tigre';
const G: CharacterId = 'gros';
const K: CharacterId = 'chaton';
const D: CharacterId = 'chien';

function h1(): AverseDef {
  const ctx = { rng: createRng(1001), chapter: 1 };
  return {
    id: 'h1', chapter: 1, pelotes: 8,
    spawns: assemble(
      pluieFine(ctx, seconds(0.5), 6, [T, T, T]),
      grappe(ctx, seconds(7), 180, [T, T, T, T, T, T]),
      pluieFine(ctx, seconds(14), 6, [T, T]),
      rideau(ctx, seconds(20), 170, [T, T, T, T, T]),
      vForm(ctx, seconds(30), 120, [T, T, T, T, T]),
      pluieFine(ctx, seconds(37), 6, [T, T]),
      grappe(ctx, seconds(45), 200, [T, T, T, T, T, T, T], 4),
    ),
  };
}

function h2(): AverseDef {
  const ctx = { rng: createRng(2001), chapter: 2 };
  return {
    id: 'h2', chapter: 2, pelotes: 8,
    spawns: assemble(
      pluieFine(ctx, seconds(0.5), 5, [T, T]),
      colonne(ctx, seconds(6), 110, [T, T, T, T, G]),
      pluieFine(ctx, seconds(14), 5, [T, T]),
      grappe(ctx, seconds(21), 200, [T, T, T, T, G, T, T], 3, LOOSE_X, LOOSE_Y),
      rideau(ctx, seconds(32), 180, [G, T, T, T, T, T]),
      pluieFine(ctx, seconds(39), 5, [T, T]),
      grappe(ctx, seconds(46), 160, [T, T, T, T, T, T, T, G], 4, LOOSE_X, LOOSE_Y),
    ),
  };
}

function h3(): AverseDef {
  const ctx = { rng: createRng(4002), chapter: 4 };
  return {
    id: 'h3', chapter: 4, pelotes: 8,
    spawns: assemble(
      pluieFine(ctx, seconds(0.5), 5, [T, K, T]),
      grappe(ctx, seconds(7), 170, [T, T, T, D, T, T, T], 3, LOOSE_X, LOOSE_Y),
      colonne(ctx, seconds(16), 260, [T, T, G, K]),
      pluieFine(ctx, seconds(22), 5, [K, T]),
      rideau(ctx, seconds(29), 180, [T, K, T, D, T, G]),
      vForm(ctx, seconds(38), 200, [G, T, T, K, K]),
      grappe(ctx, seconds(47), 150, [T, T, T, K, T, T, G, T], 4, LOOSE_X, LOOSE_Y),
    ),
  };
}

export const HANDMADE: readonly AverseDef[] = [h1(), h2(), h3()];

export function handmadeById(id: string): AverseDef | undefined {
  return HANDMADE.find(a => a.id === id);
}
