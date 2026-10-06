// Générateur d'averses (GAME_SPEC §10–§11). Une averse = f(chapitre, numéro, graine), entièrement
// déterministe. Les graines retenues sont validées par simulation puis figées dans `chapters.ts`.
//
// Chapitre k introduit le k-ième caractère de CHARACTER_ORDER. Averse 1 : le nouveau caractère seul
// parmi des tigrés. Averses 2–4 : combiné avec les précédents, densité croissante. Averse 5 : « Grande
// averse », 90 s et 45 chats, toutes les formations du chapitre.

import { WORLD_W } from '../constants';
import { CHARACTERS } from '../characters';
import { createRng } from '../rng';
import type { Rng } from '../rng';
import { assemble, colonne, escorte, grappe, pluieFine, rideau, seconds, vForm } from '../formations';
import type { FormationCtx, FormationSpawn } from '../formations';
import type { AverseDef, CharacterId } from '../types';

export const CHARACTER_ORDER: readonly CharacterId[] = [
  'tigre', 'gros', 'chaton', 'chien', 'trouillard', 'bouclier', 'fusee', 'elastique', 'fantome', 'maman',
];

export const CHAPTERS = 10;
export const AVERSES_PER_CHAPTER = 5;

export function averseId(chapter: number, index: number): string {
  return `${chapter}-${index}`;
}

type Kind = 'grappe' | 'rideau' | 'colonne' | 'v' | 'escorte' | 'garde';

interface Plan {
  durationS: number;
  cats: number;
  newChar: CharacterId;
  pool: CharacterId[]; // caractères disponibles (hors tigré), nouveau compris
  mixRate: number; // part de non-tigrés dans les formations
  grande: boolean;
  tutorial: boolean; // 1-1 : un tir dans la grappe doit marcher presque toujours (§12)
}

function plan(chapter: number, index: number): Plan {
  const newChar = CHARACTER_ORDER[chapter - 1];
  const known = CHARACTER_ORDER.slice(1, chapter);
  const grande = index === AVERSES_PER_CHAPTER;
  const base = 24 + chapter; // les chapitres avancés sont un peu plus denses
  return {
    durationS: grande ? 90 : 60,
    cats: grande ? 45 : chapter === 1 && index === 1 ? 20 : Math.min(36, base + (index - 1) * 2), // 1-1 : 20 chats (§12)
    newChar,
    // Averse 1 : le nouveau caractère seul parmi des tigrés. Ensuite : tous les caractères connus.
    pool: index === 1 ? (newChar === 'tigre' ? [] : [newChar]) : known,
    mixRate: index === 1 ? 0.22 : Math.min(0.45, 0.2 + chapter * 0.02 + index * 0.03),
    grande,
    tutorial: chapter === 1 && index === 1,
  };
}

/** Choisit le caractère d'un membre de formation ; le nouveau caractère est surreprésenté. */
function member(rng: Rng, p: Plan, avoid: CharacterId[] = []): CharacterId {
  const pool = p.pool.filter(c => !avoid.includes(c) && c !== 'maman');
  if (!pool.length || rng.next() >= p.mixRate) return 'tigre';
  if (p.pool.includes(p.newChar) && p.newChar !== 'maman' && !avoid.includes(p.newChar) && rng.next() < 0.5) return p.newChar;
  return rng.pick(pool);
}

function members(rng: Rng, p: Plan, n: number, avoid: CharacterId[] = []): CharacterId[] {
  return Array.from({ length: n }, () => member(rng, p, avoid));
}

function kindsFor(p: Plan): Kind[] {
  const kinds: Kind[] = ['grappe', 'rideau', 'colonne', 'v'];
  if (p.pool.includes('maman')) kinds.push('escorte', 'escorte');
  if (p.pool.includes('chien') || p.pool.includes('bouclier')) kinds.push('garde');
  return kinds;
}

function buildFormation(ctx: FormationCtx, p: Plan, kind: Kind, t: number): FormationSpawn[] {
  const { rng } = ctx;
  const cx = rng.range(90, WORLD_W - 90);
  switch (kind) {
    case 'grappe': {
      // Écartement > diamètre d'un chat : la chaîne dépend de l'angle d'attaque, pas seulement du contact.
      // Hors tutoriel (1-1), une grappe n'est donc pas « gratuite » pour un tir au hasard (§29).
      const n = rng.int(5, 8);
      const chars = members(rng, p, n);
      if (p.pool.includes('gros') && rng.next() < 0.25) chars[Math.floor(n / 2)] = 'gros';
      const loose = !p.tutorial;
      return grappe(ctx, t, cx, chars, n >= 7 ? 4 : 3, loose ? 50 : 42, loose ? 48 : 40);
    }
    case 'rideau': {
      const n = rng.int(4, 6);
      const chars = members(rng, p, n, ['chaton']);
      if (p.pool.includes('fusee') && rng.next() < 0.5) chars[rng.next() < 0.5 ? 0 : n - 1] = 'fusee';
      return rideau(ctx, t, cx, chars);
    }
    case 'colonne': {
      const chars = members(rng, p, rng.int(3, 5));
      if (p.pool.includes('gros') && rng.next() < 0.5) chars[chars.length - 1] = 'gros';
      // Les élastiques aiment les murs : colonne collée à un bord.
      const x = chars.includes('elastique') ? (rng.next() < 0.5 ? 40 : WORLD_W - 40) : cx;
      return colonne(ctx, t, x, chars);
    }
    case 'v':
      return vForm(ctx, t, cx, members(rng, p, rng.int(5, 7)));
    case 'escorte':
      return escorte(ctx, t, cx, rng.int(2, 4));
    case 'garde': {
      // Une grappe gardée : chiens au milieu ou boucliers au-dessus (§11 « Garde »).
      const chars = members(rng, p, 6, ['chien', 'bouclier']);
      if (p.pool.includes('chien')) chars[rng.int(1, 4)] = 'chien';
      const g = grappe(ctx, t, cx, chars);
      if (!p.pool.includes('bouclier')) return g;
      const top = g.reduce((m, sp) => Math.max(m, sp.tick), t);
      return g.concat(rideau(ctx, top + seconds(0.7), cx, ['bouclier', 'bouclier', 'bouclier']));
    }
  }
}

function countCats(groups: FormationSpawn[][]): number {
  return groups.reduce((n, g) => n + g.length, 0);
}

export function generateAverse(chapter: number, index: number, seed: number): AverseDef {
  const p = plan(chapter, index);
  const rng = createRng(seed);
  const ctx: FormationCtx = { rng, chapter };
  const groups: FormationSpawn[][] = [];
  const end = seconds(p.durationS - 12);
  const kinds = kindsFor(p);
  let t = seconds(0.5);
  let structured = 0;

  // Place réservée à la finale (une grappe de 5–8, deux pour la Grande averse).
  const reserve = p.grande ? 13 : 6;
  while (t < end && countCats(groups) < p.cats - reserve) {
    const secondHalf = t > end / 2;
    // Respiration en pluie fine, moins fréquente en deuxième moitié (densité croissante, §11).
    if (rng.next() < (secondHalf ? 0.25 : 0.45)) {
      const n = rng.int(2, 3);
      groups.push(pluieFine(ctx, t, 4, members(rng, p, n, ['chaton'])));
      t += seconds(rng.range(4, 5.5));
      continue;
    }
    // Le premier caractère nouveau se montre tôt et à l'écart, pour qu'on le découvre (§13).
    let kind: Kind = rng.pick(kinds);
    if (structured === 0 && p.newChar === 'maman') kind = 'escorte';
    groups.push(buildFormation(ctx, p, kind, t));
    structured++;
    t += seconds(rng.range(secondHalf ? 5 : 6, secondHalf ? 7 : 8.5));
  }
  // Finale garantie dans les 10 dernières secondes : grappe (ou escorte au chapitre 10).
  const finale: Kind = p.pool.includes('maman') && rng.next() < 0.5 ? 'escorte' : 'grappe';
  groups.push(buildFormation(ctx, p, finale, Math.max(t, seconds(p.durationS - 11))));
  if (p.grande) groups.push(buildFormation(ctx, p, 'grappe', Math.max(t, seconds(p.durationS - 11)) + seconds(3)));

  const spawns = assemble(...groups);
  const catchable = spawns.filter(sp => CHARACTERS[sp.char].catchable).length;
  return {
    id: averseId(chapter, index),
    chapter,
    pelotes: Math.max(6, Math.round((catchable * 8) / 30)),
    spawns,
  };
}
