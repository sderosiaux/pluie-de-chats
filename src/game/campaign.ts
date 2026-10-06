// Règles de campagne côté client (GAME_SPEC §8, §10) : déblocage, averse suivante, costumes rares.
// Fonctions pures de la progression ; aucune ne touche à la simulation.

import { campaignAverse } from '../sim/averses/chapters';
import { AVERSES_PER_CHAPTER, CHAPTERS, averseId } from '../sim/averses/generator';
import { RARE_TIGRE_COSTUMES } from '../sim/costumes';
import type { AverseDef } from '../sim';
import { starsOf } from './progress';
import type { Progress } from './progress';

export interface Slot {
  readonly chapter: number;
  readonly index: number;
}

const ID = /^(\d{1,2})-(\d)$/;

export function parseSlot(id: string): Slot | null {
  const m = ID.exec(id);
  if (!m) return null;
  const chapter = Number(m[1]), index = Number(m[2]);
  return chapter >= 1 && chapter <= CHAPTERS && index >= 1 && index <= AVERSES_PER_CHAPTER ? { chapter, index } : null;
}

export const slotId = (s: Slot): string => averseId(s.chapter, s.index);

const defs = new Map<string, AverseDef | undefined>();

/** Averse figée de la campagne, ou undefined si sa graine n'existe pas encore (« bientôt »). Mémoïsée. */
export function averseFor(s: Slot): AverseDef | undefined {
  const id = slotId(s);
  if (!defs.has(id)) defs.set(id, campaignAverse(s.chapter, s.index));
  return defs.get(id);
}

/**
 * §10 : 1-1 ouverte au départ ; N+1 dès 1 🐾 sur N ; chapitre suivant dès 1 🐾 sur la Grande averse
 * du précédent. Les 3 🐾 ne bloquent jamais.
 */
export function isUnlocked(p: Progress, s: Slot): boolean {
  if (s.chapter === 1 && s.index === 1) return true;
  const prev = s.index > 1 ? { chapter: s.chapter, index: s.index - 1 } : { chapter: s.chapter - 1, index: AVERSES_PER_CHAPTER };
  return starsOf(p, slotId(prev)) >= 1;
}

/** Jouable = débloquée et figée (graine présente). */
export function isPlayable(p: Progress, s: Slot): boolean {
  return isUnlocked(p, s) && averseFor(s) !== undefined;
}

export function nextSlot(s: Slot): Slot | null {
  if (s.index < AVERSES_PER_CHAPTER) return { chapter: s.chapter, index: s.index + 1 };
  return s.chapter < CHAPTERS ? { chapter: s.chapter + 1, index: 1 } : null;
}

export function isGrande(s: Slot): boolean {
  return s.index === AVERSES_PER_CHAPTER;
}

export function allSlots(): Slot[] {
  const out: Slot[] = [];
  for (let chapter = 1; chapter <= CHAPTERS; chapter++) {
    for (let index = 1; index <= AVERSES_PER_CHAPTER; index++) out.push({ chapter, index });
  }
  return out;
}

/** Première averse jouable sans patte, dans l'ordre de la campagne : c'est elle que la carte met en avant. */
export function suggestedSlot(p: Progress): Slot | null {
  return allSlots().find(s => isPlayable(p, s) && starsOf(p, slotId(s)) === 0) ?? null;
}

// ── Costumes rares (§8) ──────────────────────────────────────────────────────

export const RARE_RATE = 50; // un tigré sur 50 (2 %)
const RARE_AFTER_CHAPTER = 3;

/** Les costumes rares apparaissent une fois le chapitre 3 passé (1 🐾 sur sa Grande averse). */
export function rareCostumesEnabled(p: Progress): boolean {
  return starsOf(p, averseId(RARE_AFTER_CHAPTER, AVERSES_PER_CHAPTER)) >= 1;
}

/** FNV-1a 32 bits sur la chaîne : stable entre moteurs JS, sans aléa. */
function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Costume rare d'un tigré, ou null. Fonction pure de (averse, chat) : le même chat de la même averse
 * porte toujours le même costume. Le chat est identifié par son index dans `spawns` (et non par l'id
 * attribué par la sim, qui dépend des tirs déjà faits puisque pelotes et chats partagent le compteur).
 */
export function rareCostume(averse: string, spawnIdx: number): string | null {
  const h = fnv1a(`${averse}#${spawnIdx}`);
  if (h % RARE_RATE !== 0) return null;
  return RARE_TIGRE_COSTUMES[Math.floor(h / RARE_RATE) % RARE_TIGRE_COSTUMES.length];
}

/** Costumes rares d'une averse : index de spawn → costume. Vide si les rares ne sont pas encore débloqués. */
export function rareCostumesFor(averse: AverseDef, enabled: boolean): ReadonlyMap<number, string> {
  const out = new Map<number, string>();
  if (!enabled) return out;
  averse.spawns.forEach((sp, i) => {
    if (sp.char !== 'tigre') return;
    const c = rareCostume(averse.id, i);
    if (c) out.set(i, c);
  });
  return out;
}
