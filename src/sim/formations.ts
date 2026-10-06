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
export function pluieFine(ctx: FormationCtx, t0: number, durationS: number, chars: CharacterId[]): SpawnDef[] {
  const out: SpawnDef[] = [];
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
export function rideau(ctx: FormationCtx, t0: number, cx: number, chars: CharacterId[], gap = 46): SpawnDef[] {
  const s = sway(ctx, ctx.rng.range(4, 10));
  const w = (chars.length - 1) * gap;
  return chars.map((char, i) => ({ tick: t0, char, costume: costume(ctx, char), x: clampX(cx - w / 2 + i * gap, char), ...s }));
}

/** Pile verticale : le premier élément est en bas (apparaît le premier). */
export function colonne(ctx: FormationCtx, t0: number, x: number, chars: CharacterId[], gap = 50): SpawnDef[] {
  const s = sway(ctx, ctx.rng.range(4, 10));
  let t = t0;
  return chars.map((char, i) => {
    if (i > 0) t += ticksForGap(gap, char);
    return { tick: t, char, costume: costume(ctx, char), x: clampX(x, char), ...s };
  });
}

/** Grappe serrée : rangées en quinconce, de bas en haut. `chars` est rempli rangée par rangée. */
export function grappe(ctx: FormationCtx, t0: number, cx: number, chars: CharacterId[], perRow = 3, gapX = 42, gapY = 40): SpawnDef[] {
  const s = sway(ctx, ctx.rng.range(4, 8));
  const out: SpawnDef[] = [];
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
export function vForm(ctx: FormationCtx, t0: number, cx: number, chars: CharacterId[], gapX = 36, gapY = 34): SpawnDef[] {
  const s = sway(ctx, ctx.rng.range(4, 8));
  const out: SpawnDef[] = [];
  chars.forEach((char, i) => {
    const level = Math.ceil(i / 2);
    const side = i === 0 ? 0 : i % 2 === 1 ? -1 : 1;
    out.push({ tick: t0 + ticksForGap(level * gapY, char), char, costume: costume(ctx, char), x: clampX(cx + side * level * gapX, char), ...s });
  });
  return out;
}

/** Assemble des formations en une liste triée par tick (tri stable : l'ordre d'insertion départage). */
export function assemble(...groups: SpawnDef[][]): SpawnDef[] {
  return groups.flat().map((sp, i) => ({ sp, i })).sort((a, b) => a.sp.tick - b.sp.tick || a.i - b.i).map(e => e.sp);
}

export const seconds = (s: number): number => Math.round(s * SEC);
