// Progression locale (GAME_SPEC §22) : meilleurs résultats par averse, carnet, préférence son.
// Tout est pur ici (sérialisation, lecture tolérante, fusion) ; seuls `loadProgress`/`saveProgress`
// touchent au stockage, et ne lèvent jamais : un stockage absent ou plein ne doit pas bloquer le jeu.

import { AVERSES_PER_CHAPTER, CHAPTERS, CHARACTER_ORDER } from '../sim/averses/generator';
import type { CharacterId } from '../sim';

/** Clé versionnée : un changement de format change la clé, l'ancienne donnée est ignorée (on repart de zéro). */
export const PROGRESS_VERSION = 1;
export const STORAGE_KEY = `pluie-de-chats:progress:v${PROGRESS_VERSION}`;

export type Stars = 0 | 1 | 2 | 3;

export interface AverseBest {
  readonly stars: Stars;
  readonly score: number;
  readonly chain: number;
}

export interface Progress {
  /** Par id d'averse de campagne (« 1-2 ») : chaque champ est le meilleur obtenu, indépendamment des autres. */
  readonly averses: Readonly<Record<string, AverseBest>>;
  /** Caractères rencontrés, dans l'ordre de rencontre. */
  readonly met: readonly CharacterId[];
  /** Pages du carnet déjà ouvertes (le badge « nouveau » disparaît). */
  readonly read: readonly CharacterId[];
  /** Costumes vus, par caractère. */
  readonly costumes: Readonly<Partial<Record<CharacterId, readonly string[]>>>;
  readonly sound: boolean;
}

export function emptyProgress(): Progress {
  return { averses: {}, met: [], read: [], costumes: {}, sound: true };
}

// ── Lecture tolérante ────────────────────────────────────────────────────────

const CAMPAIGN_ID = /^(\d{1,2})-(\d)$/;
// Un costume finit dans une URL de sprite : on n'accepte que des noms simples.
const COSTUME_NAME = /^[a-z0-9_]{1,32}$/;

function isCampaignId(id: string): boolean {
  const m = CAMPAIGN_ID.exec(id);
  if (!m) return false;
  const ch = Number(m[1]), i = Number(m[2]);
  return ch >= 1 && ch <= CHAPTERS && i >= 1 && i <= AVERSES_PER_CHAPTER;
}

function isCharacter(v: unknown): v is CharacterId {
  return typeof v === 'string' && (CHARACTER_ORDER as readonly string[]).includes(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

function readBest(v: unknown): AverseBest | null {
  if (!isRecord(v)) return null;
  const { stars, score, chain } = v;
  if (!isInt(stars) || stars < 0 || stars > 3 || !isInt(score) || !isInt(chain) || chain < 0) return null;
  return { stars: stars as Stars, score, chain };
}

function uniqueChars(v: unknown): CharacterId[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter(isCharacter))];
}

/**
 * Lit une progression sérialisée. Jamais d'exception : JSON invalide, mauvaise version ou mauvaise forme
 * → progression vide. Une entrée invalide isolée (averse inconnue, costume douteux…) est simplement ignorée.
 */
export function parseProgress(raw: string | null): Progress {
  if (raw === null) return emptyProgress();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  if (!isRecord(data) || data.v !== PROGRESS_VERSION) return emptyProgress();

  const averses: Record<string, AverseBest> = {};
  if (isRecord(data.averses)) {
    for (const [id, v] of Object.entries(data.averses)) {
      const best = readBest(v);
      if (best && isCampaignId(id)) averses[id] = best;
    }
  }
  const costumes: Partial<Record<CharacterId, string[]>> = {};
  if (isRecord(data.costumes)) {
    for (const [ch, list] of Object.entries(data.costumes)) {
      if (!isCharacter(ch) || !Array.isArray(list)) continue;
      const ok = [...new Set(list.filter((c): c is string => typeof c === 'string' && COSTUME_NAME.test(c)))];
      if (ok.length) costumes[ch] = ok;
    }
  }
  const met = uniqueChars(data.met);
  return {
    averses,
    met,
    read: uniqueChars(data.read).filter(c => met.includes(c)),
    costumes,
    sound: typeof data.sound === 'boolean' ? data.sound : true,
  };
}

export function serializeProgress(p: Progress): string {
  return JSON.stringify({ v: PROGRESS_VERSION, averses: p.averses, met: p.met, read: p.read, costumes: p.costumes, sound: p.sound });
}

// ── Fusion ───────────────────────────────────────────────────────────────────

/** Meilleur de deux résultats, champ par champ : une averse rejouée moins bien n'efface rien. */
export function mergeBest(a: AverseBest | undefined, b: AverseBest): AverseBest {
  if (!a) return b;
  return {
    stars: Math.max(a.stars, b.stars) as Stars,
    score: Math.max(a.score, b.score),
    chain: Math.max(a.chain, b.chain),
  };
}

export function recordResult(p: Progress, averseId: string, result: AverseBest): Progress {
  if (!isCampaignId(averseId)) return p;
  return { ...p, averses: { ...p.averses, [averseId]: mergeBest(p.averses[averseId], result) } };
}

export function starsOf(p: Progress, averseId: string): Stars {
  return p.averses[averseId]?.stars ?? 0;
}

export function meet(p: Progress, ch: CharacterId): Progress {
  return p.met.includes(ch) ? p : { ...p, met: [...p.met, ch] };
}

export function seeCostume(p: Progress, ch: CharacterId, costume: string): Progress {
  const seen = p.costumes[ch] ?? [];
  if (seen.includes(costume) || !COSTUME_NAME.test(costume)) return p;
  return { ...p, costumes: { ...p.costumes, [ch]: [...seen, costume] } };
}

export function markRead(p: Progress, ch: CharacterId): Progress {
  return p.read.includes(ch) || !p.met.includes(ch) ? p : { ...p, read: [...p.read, ch] };
}

export function isNew(p: Progress, ch: CharacterId): boolean {
  return p.met.includes(ch) && !p.read.includes(ch);
}

export function withSound(p: Progress, sound: boolean): Progress {
  return p.sound === sound ? p : { ...p, sound };
}

// ── Stockage (seule partie impure) ───────────────────────────────────────────

export function loadProgress(storage: Storage | null): Progress {
  if (!storage) return emptyProgress();
  try {
    return parseProgress(storage.getItem(STORAGE_KEY));
  } catch {
    return emptyProgress(); // accès refusé (navigation privée, iframe…)
  }
}

/** Renvoie false si l'écriture a échoué (quota, accès refusé) : le jeu continue, la progression reste en mémoire. */
export function saveProgress(storage: Storage | null, p: Progress): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, serializeProgress(p));
    return true;
  } catch {
    return false;
  }
}
