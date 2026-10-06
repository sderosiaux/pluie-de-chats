// Formations de chats (GAME_SPEC §11). Chaque fonction renvoie des SpawnDef déterministes
// à partir d'un Rng : les averses écrites à la main et le générateur (P2) les partagent.
// Les membres d'une formation partagent leur oscillation, pour rester groupés en tombant.

import { CAT_BASE_R, WORLD_W } from './constants';
import { CHARACTERS } from './characters';
import { costumesFor } from './costumes';
import type { Rng } from './rng';
import type { CharacterId, SpawnDef } from './types';

export interface FormationCtx {
  rng: Rng;
  chapter: number;
}

const SEC = 120;

function margin(char: CharacterId): number {
  return CAT_BASE_R * CHARACTERS[char].scale + 4;
}

function costume(ctx: FormationCtx, char: CharacterId): string {
  return ctx.rng.pick(costumesFor(char, ctx.chapter));
}

function clampX(x: number, char: CharacterId): number {
  const m = margin(char);
  return x < m ? m : x > WORLD_W - m ? WORLD_W - m : x;
}

/** Ticks d'écart pour qu'un chat apparaisse `dy` px au-dessus d'un autre (même vitesse de chute). */
function ticksForGap(dy: number, char: CharacterId): number {
  return Math.round((dy / CHARACTERS[char].fallSpeed) * SEC);
}

function sway(ctx: FormationCtx, amp: number): { swayAmp: number; swayPhase: number } {
  return { swayAmp: amp, swayPhase: ctx.rng.next() };
}

/** Chats isolés, répartis sur `durationS` secondes. */
export function pluieFine(ctx: FormationCtx, t0: number, durationS: number, chars: CharacterId[]): FormationSpawn[] {
  const out: FormationSpawn[] = [];
  const step = (durationS * SEC) / Math.max(1, chars.length);
  chars.forEach((char, i) => {
    out.push({
      tick: Math.round(t0 + i * step + ctx.rng.range(0, step * 0.4)),
      char,
      costume: costume(ctx, char),
      x: clampX(ctx.rng.range(30, WORLD_W - 30), char),
      ...sway(ctx, ctx.rng.range(6, 18)),
    });
  });
  return out;
}

/** Rangée horizontale, même tick. */
export function rideau(ctx: FormationCtx, t0: number, cx: number, chars: CharacterId[], gap = 46): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 10));
  const w = (chars.length - 1) * gap;
  return chars.map((char, i) => ({ tick: t0, char, costume: costume(ctx, char), x: clampX(cx - w / 2 + i * gap, char), ...s }));
}

/** Pile verticale : le premier élément est en bas (apparaît le premier). */
export function colonne(ctx: FormationCtx, t0: number, x: number, chars: CharacterId[], gap = 50): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 10));
  let t = t0;
  return chars.map((char, i) => {
    if (i > 0) t += ticksForGap(gap, char);
    return { tick: t, char, costume: costume(ctx, char), x: clampX(x, char), ...s };
  });
}

/** Grappe serrée : rangées en quinconce, de bas en haut. `chars` est rempli rangée par rangée. */
export function grappe(ctx: FormationCtx, t0: number, cx: number, chars: CharacterId[], perRow = 3, gapX = 42, gapY = 40): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 8));
  const out: FormationSpawn[] = [];
  let t = t0;
  for (let row = 0; row * perRow < chars.length; row++) {
    const rowChars = chars.slice(row * perRow, row * perRow + perRow);
    if (row > 0) t += ticksForGap(gapY, rowChars[0]);
    const off = row % 2 === 1 ? gapX / 2 : 0;
    const w = (rowChars.length - 1) * gapX;
    rowChars.forEach((char, i) => {
      out.push({ tick: t, char, costume: costume(ctx, char), x: clampX(cx - w / 2 + off + i * gapX, char), ...s });
    });
  }
  return out;
}

/** V pointe en bas : la pointe apparaît la première. */
export function vForm(ctx: FormationCtx, t0: number, cx: number, chars: CharacterId[], gapX = 36, gapY = 34): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 8));
  const out: FormationSpawn[] = [];
  chars.forEach((char, i) => {
    const level = Math.ceil(i / 2);
    const side = i === 0 ? 0 : i % 2 === 1 ? -1 : 1;
    out.push({ tick: t0 + ticksForGap(level * gapY, char), char, costume: costume(ctx, char), x: clampX(cx + side * level * gapX, char), ...s });
  });
  return out;
}

/** Maman + chatons en escorte (§8). Les chatons suivent la maman tant qu'elle tombe. */
export function escorte(ctx: FormationCtx, t0: number, cx: number, kittens: number): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 10));
  const mom: FormationSpawn = { tick: t0, char: 'maman', costume: costume(ctx, 'maman'), x: clampX(cx, 'maman'), ...s };
  const offsets = [[-34, 8], [34, 8], [-18, -30], [18, -30]];
  const out: FormationSpawn[] = [mom];
  for (let i = 0; i < kittens && i < offsets.length; i++) {
    out.push({ tick: t0, char: 'chaton', costume: costume(ctx, 'chaton'), x: clampX(cx + offsets[i][0], 'chaton'), swayAmp: 0, swayPhase: 0,
      escortLocal: 0, escortDx: offsets[i][0], escortDy: offsets[i][1] });
  }
  return out;
}

/** Spawn en cours d'assemblage : `escortLocal` = index de la maman dans SA formation. */
export type FormationSpawn = SpawnDef & { escortLocal?: number };

/**
 * Assemble des formations en une liste triée par tick (tri stable : l'ordre d'insertion départage)
 * et traduit les références d'escorte locales en index globaux. Une maman précède toujours ses chatons.
 */
export function assemble(...groups: FormationSpawn[][]): SpawnDef[] {
  const items = groups.flatMap((g, gi) => g.map((sp, li) => ({ sp, gi, li })));
  const order = items.map((e, i) => ({ e, i })).sort((a, b) => a.e.sp.tick - b.e.sp.tick || a.i - b.i);
  const globalIndex = new Map<string, number>();
  order.forEach(({ e }, k) => globalIndex.set(`${e.gi}:${e.li}`, k));
  return order.map(({ e }) => {
    const { escortLocal, ...rest } = e.sp;
    if (escortLocal === undefined) return rest;
    return { ...rest, escortOf: globalIndex.get(`${e.gi}:${escortLocal}`) };
  });
}

export const seconds = (s: number): number => Math.round(s * SEC);
