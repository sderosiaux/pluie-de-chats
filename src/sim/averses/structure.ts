// Règles de structure d'une averse (GAME_SPEC §10, §11, §13). Partagées par le test et par le gel des
// graines : une graine n'est retenue que si son averse les respecte toutes.

import { CHARACTER_ORDER, formationKinds } from './generator';
import type { Kind } from './generator';
import type { AverseDef } from '../types';
import { createSim, step } from '../sim';

const SEC = 120;
export const MAX_HOLE_S = 9;
export const MAX_EMPTY_SCREEN_S = 6;
// Tolérance de chevauchement : deux chats dont les cercles se recouvrent de plus de 10 % ne se lisent plus.
const OVERLAP = 0.9;

/**
 * Joue l'averse sans tir et mesure ce que voit le joueur : chats qui se chevauchent en tombant (hors
 * chatons d'escorte, collés à leur meneur par construction) et plus longue période d'écran vide.
 */
function playedProblems(averse: AverseDef): string[] {
  const out: string[] = [];
  const s = createSim(averse);
  let emptySince = -1, maxEmpty = 0, seenAny = false;
  const overlaps = new Set<string>();
  while (!s.ended) {
    step(s);
    s.events.length = 0;
    const cats = s.cats.filter(c => c.st === 'fall' && c.y > -c.r);
    if (cats.length) seenAny = true;
    if (!cats.length && seenAny && s.nextSpawn < averse.spawns.length) { if (emptySince < 0) emptySince = s.tick; }
    else if (emptySince >= 0) { maxEmpty = Math.max(maxEmpty, s.tick - emptySince); emptySince = -1; }
    for (let i = 0; i < cats.length; i++) for (let j = i + 1; j < cats.length; j++) {
      const a = cats[i], b = cats[j];
      if (a.escortOf === b.id || b.escortOf === a.id || (a.escortOf >= 0 && a.escortOf === b.escortOf)) continue;
      const dx = a.x - b.x, dy = a.y - b.y, rr = (a.r + b.r) * OVERLAP;
      if (dx * dx + dy * dy < rr * rr) overlaps.add(`${a.spawnIdx}/${b.spawnIdx}`);
    }
  }
  if (maxEmpty > MAX_EMPTY_SCREEN_S * SEC) out.push(`écran vide ${(maxEmpty / SEC).toFixed(1)} s`);
  for (const k of overlaps) out.push(`chevauchement des chats ${k}`);
  return out;
}

export function structureProblems(chapter: number, index: number, averse: AverseDef, trace: readonly Kind[]): string[] {
  const out: string[] = [];
  const grande = index === 5;
  const duration = grande ? 90 : 60;
  const half = ((duration - 12) * SEC) / 2;
  const ticks = averse.spawns.map(s => s.tick);

  const firstHalf = ticks.filter(t => t < half).length;
  if (ticks.length - firstHalf <= firstHalf) out.push(`densité : ${firstHalf} chats en 1re moitié, ${ticks.length - firstHalf} en 2e`);
  for (let i = 1; i < ticks.length; i++) {
    if (ticks[i] - ticks[i - 1] > MAX_HOLE_S * SEC) out.push(`trou de ${((ticks[i] - ticks[i - 1]) / SEC).toFixed(1)} s à ${(ticks[i - 1] / SEC).toFixed(1)} s`);
  }

  const owner = new Map<string, string>();
  for (const s of averse.spawns) {
    if ((owner.get(s.costume) ?? s.char) !== s.char) out.push(`costume ${s.costume} porte deux caractères`);
    owner.set(s.costume, s.char);
  }

  const allowed = new Set(CHARACTER_ORDER.slice(0, chapter));
  for (const s of averse.spawns) if (!allowed.has(s.char)) out.push(`${s.char} avant son chapitre`);

  if (grande) for (const k of formationKinds(chapter, index)) if (!trace.includes(k)) out.push(`Grande averse sans formation ${k}`);

  const newChar = CHARACTER_ORDER[chapter - 1];
  if (index < 5 && chapter > 1) {
    const first = averse.spawns.find(s => s.char === newChar)?.tick ?? Infinity;
    if (first >= ((duration - 12) * SEC) / 3) out.push(`${newChar} n'apparaît pas dans le premier tiers`);
  }
  return out.concat(playedProblems(averse));
}

/** Empreinte d'une averse (FNV-1a sur sa description) : détecte toute dérive d'une averse figée. */
export function averseFingerprint(averse: AverseDef): string {
  const text = JSON.stringify(averse);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
