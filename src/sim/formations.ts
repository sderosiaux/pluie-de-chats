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

/**
 * Ticks d'attente pour qu'un chat apparaisse `dy` px au-dessus de `below`, qui tombe déjà : c'est la vitesse
 * du chat du DESSOUS qui fixe l'écart. Les membres étant rangés du plus rapide (bas) au plus lent (haut),
 * cet écart ne fait ensuite que grandir : aucun chat ne rattrape celui du dessous.
 */
function ticksForGap(dy: number, below: CharacterId): number {
  return Math.round((dy / CHARACTERS[below].fallSpeed) * SEC);
}

/** Rayon d'un caractère (comme dans la sim). */
export function radiusOf(char: CharacterId): number {
  return CAT_BASE_R * CHARACTERS[char].scale;
}

/** Distance minimale entre deux centres pour que deux chats ne se chevauchent pas à l'écran (marge de 2 px). */
function minSep(a: CharacterId, b: CharacterId): number {
  return radiusOf(a) + radiusOf(b) + 2;
}

/** Abscisses d'une rangée : `gap` entre voisins, élargi si deux gros chats se touchent. Centrées sur 0. */
function rowXs(chars: readonly CharacterId[], gap: number): number[] {
  const xs = [0];
  for (let i = 1; i < chars.length; i++) xs.push(xs[i - 1] + Math.max(gap, minSep(chars[i - 1], chars[i])));
  const mid = xs[xs.length - 1] / 2;
  return xs.map(x => x - mid);
}

/** Du plus rapide au plus lent (tri stable). */
function fastestFirst(chars: readonly CharacterId[]): CharacterId[] {
  return chars.map((c, i) => ({ c, i })).sort((a, b) => CHARACTERS[b.c].fallSpeed - CHARACTERS[a.c].fallSpeed || a.i - b.i).map(e => e.c);
}

/**
 * Recentre une formation de demi-largeur `halfW` pour qu'elle tienne entière dans le monde. Recadrer chaque
 * membre séparément les empilerait contre le bord (deux chats au même endroit).
 */
function clampCenter(cx: number, halfW: number, chars: readonly CharacterId[]): number {
  const m = Math.max(...chars.map(margin));
  const lo = halfW + m, hi = WORLD_W - halfW - m;
  return lo > hi ? WORLD_W / 2 : cx < lo ? lo : cx > hi ? hi : cx;
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
  const xs = rowXs(chars, gap);
  const c = clampCenter(cx, xs[xs.length - 1] + s.swayAmp, chars);
  return chars.map((char, i) => ({ tick: t0, char, costume: costume(ctx, char), x: c + xs[i], ...s }));
}

/** Pile verticale, du plus rapide (en bas, apparaît le premier) au plus lent (en haut). */
export function colonne(ctx: FormationCtx, t0: number, x: number, chars: CharacterId[], gap = 50): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 10));
  const ordered = fastestFirst(chars);
  const cx = clampCenter(x, s.swayAmp, ordered);
  let t = t0;
  return ordered.map((char, i) => {
    if (i > 0) t += ticksForGap(Math.max(gap, minSep(ordered[i - 1], char)), ordered[i - 1]);
    return { tick: t, char, costume: costume(ctx, char), x: cx, ...s };
  });
}

/** Grappe : rangées en quinconce, de bas en haut, du plus rapide au plus lent. */
export function grappe(ctx: FormationCtx, t0: number, cx: number, chars: CharacterId[], perRow = 3, gapX = 42, gapY = 40): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 8));
  const ordered = fastestFirst(chars);
  const rows: CharacterId[][] = [];
  for (let i = 0; i < ordered.length; i += perRow) rows.push(ordered.slice(i, i + perRow));
  const rowsX = rows.map(r => rowXs(r, gapX));
  const halfW = Math.max(...rowsX.map(xs => xs[xs.length - 1])) + gapX / 2;
  const c = clampCenter(cx, halfW + s.swayAmp, ordered);
  const out: FormationSpawn[] = [];
  let t = t0;
  rows.forEach((rowChars, row) => {
    if (row > 0) {
      const below = rows[row - 1];
      const maxR = (cs: CharacterId[]) => Math.max(...cs.map(radiusOf));
      // Écart réglé sur le plus lent de la rangée du dessous (pire cas), et assez grand pour les gros.
      const dy = Math.max(gapY, maxR(below) + maxR(rowChars) + 2);
      t += ticksForGap(dy, below[below.length - 1]);
    }
    const off = row % 2 === 1 ? gapX / 2 : 0;
    rowChars.forEach((char, i) => {
      out.push({ tick: t, char, costume: costume(ctx, char), x: c + rowsX[row][i] + off, ...s });
    });
  });
  return out;
}

/** V pointe en bas : la pointe (le plus rapide) apparaît la première. */
export function vForm(ctx: FormationCtx, t0: number, cx: number, chars: CharacterId[], gapX = 36, gapY = 34): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 8));
  const ordered = fastestFirst(chars);
  // Deux membres voisins d'un même côté sont distants de √(gapX² + gapY²) : on agrandit le V s'il y a des gros.
  const need = Math.max(...ordered.map(radiusOf)) * 2 + 2;
  const k = Math.max(1, need / Math.sqrt(gapX * gapX + gapY * gapY));
  const gx = gapX * k, gy = gapY * k;
  const maxLevel = Math.ceil((ordered.length - 1) / 2);
  const c = clampCenter(cx, maxLevel * gx + s.swayAmp, ordered);
  const out: FormationSpawn[] = [];
  let t = t0;
  let prevLevel = 0;
  ordered.forEach((char, i) => {
    const level = Math.ceil(i / 2);
    const side = i === 0 ? 0 : i % 2 === 1 ? -1 : 1;
    // Chaque niveau du V attend le précédent à sa vitesse (le plus lent du niveau du dessous).
    if (level > prevLevel) { t += ticksForGap(gy, ordered[i - 1]); prevLevel = level; }
    out.push({ tick: t, char, costume: costume(ctx, char), x: c + side * level * gx, ...s });
  });
  return out;
}

/**
 * Chatons en escorte d'un meneur (§11). Avec une maman, les chatons la rejoignent quand elle est attrapée
 * (§8). Avec un gros, c'est le « piège à chatons » : des chats légers qui étouffent la chaîne autour du gros.
 */
export function escorte(ctx: FormationCtx, t0: number, cx: number, kittens: number, leader: CharacterId = 'maman'): FormationSpawn[] {
  const s = sway(ctx, ctx.rng.range(4, 10));
  const offsets = [[-34, 8], [34, 8], [-18, -30], [18, -30]];
  // L'escorte entière tient dans le monde : un meneur collé au mur écraserait ses chatons contre lui.
  const c = clampCenter(cx, 34 + s.swayAmp, [leader, 'chaton']);
  const mom: FormationSpawn = { tick: t0, char: leader, costume: costume(ctx, leader), x: c, ...s };
  const out: FormationSpawn[] = [mom];
  for (let i = 0; i < kittens && i < offsets.length; i++) {
    out.push({ tick: t0, char: 'chaton', costume: costume(ctx, 'chaton'), x: c + offsets[i][0], swayAmp: 0, swayPhase: 0,
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
