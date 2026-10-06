// Générateur d'averses (GAME_SPEC §10–§11). Une averse = f(chapitre, numéro, graine), entièrement
// déterministe. Les graines retenues sont validées par simulation puis figées dans `chapters.ts`.
//
// Chapitre k introduit le k-ième caractère de CHARACTER_ORDER. Averse 1 : le nouveau caractère seul
// parmi des tigrés. Averses 2–4 : combiné avec les précédents, densité croissante. Averse 5 : « Grande
// averse », 90 s et 45 chats, toutes les formations du chapitre.

import { WORLD_H, WORLD_W } from '../constants';
import { CHARACTERS } from '../characters';
import { createRng } from '../rng';
import type { Rng } from '../rng';
import { assemble, colonne, escorte, grappe, pluieFine, radiusOf, rideau, seconds, vForm } from '../formations';
import type { FormationCtx, FormationSpawn } from '../formations';
import type { AverseDef, CharacterId } from '../types';

const SEC = 120;

export const CHARACTER_ORDER: readonly CharacterId[] = [
  'tigre', 'gros', 'chaton', 'chien', 'trouillard', 'bouclier', 'fusee', 'elastique', 'fantome', 'maman',
];

export const CHAPTERS = 10;
export const AVERSES_PER_CHAPTER = 5;

export function averseId(chapter: number, index: number): string {
  return `${chapter}-${index}`;
}

export type Kind = 'grappe' | 'rideau' | 'colonne' | 'v' | 'escorte' | 'garde' | 'piege';

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
// Maman (escortes) et fantôme (pluie fine, plafonné) ne sont jamais tirés comme membres de formation.
const PLACED_APART: readonly CharacterId[] = ['maman', 'fantome'];

function member(rng: Rng, p: Plan, avoid: CharacterId[] = []): CharacterId {
  const pool = p.pool.filter(c => !avoid.includes(c) && !PLACED_APART.includes(c));
  if (!pool.length || rng.next() >= p.mixRate) return 'tigre';
  if (p.pool.includes(p.newChar) && !PLACED_APART.includes(p.newChar) && !avoid.includes(p.newChar) && rng.next() < 0.5) return p.newChar;
  return rng.pick(pool);
}

function members(rng: Rng, p: Plan, n: number, avoid: CharacterId[] = []): CharacterId[] {
  return Array.from({ length: n }, () => member(rng, p, avoid));
}

/** Formations possibles d'une averse (toutes doivent apparaître dans une Grande averse, §10). */
export function formationKinds(chapter: number, index: number): Kind[] {
  return [...new Set(kindsFor(plan(chapter, index)))];
}

function kindsFor(p: Plan): Kind[] {
  const kinds: Kind[] = ['grappe', 'rideau', 'colonne', 'v'];
  if (p.pool.includes('maman')) kinds.push('escorte', 'escorte');
  if (p.pool.includes('chien') || p.pool.includes('bouclier')) kinds.push('garde');
  if (p.pool.includes('gros') && p.pool.includes('chaton')) kinds.push('piege');
  return kinds;
}

/** Place `force` parmi les membres (à la place du tigré le plus central) AVANT la construction, pour que la
 * formation range encore ses membres du plus rapide au plus lent. */
function inject(chars: CharacterId[], force: CharacterId | undefined): CharacterId[] {
  if (!force || chars.includes(force)) return chars;
  const tigres = chars.map((c, i) => (c === 'tigre' ? i : -1)).filter(i => i >= 0);
  if (!tigres.length) return chars;
  const mid = (chars.length - 1) / 2;
  const at = tigres.reduce((best, i) => (Math.abs(i - mid) < Math.abs(best - mid) ? i : best), tigres[0]);
  chars[at] = force;
  return chars;
}

function buildFormation(ctx: FormationCtx, p: Plan, kind: Kind, t: number, force?: CharacterId): FormationSpawn[] {
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
      return grappe(ctx, t, cx, inject(chars, force), n >= 7 ? 4 : 3, loose ? 50 : 42, loose ? 48 : 40);
    }
    case 'rideau': {
      const n = rng.int(4, 6);
      const chars = members(rng, p, n, ['chaton']);
      if (p.pool.includes('fusee') && rng.next() < 0.5) chars[rng.next() < 0.5 ? 0 : n - 1] = 'fusee';
      return rideau(ctx, t, cx, inject(chars, force));
    }
    case 'colonne': {
      const chars = members(rng, p, rng.int(3, 5));
      if (p.pool.includes('gros') && rng.next() < 0.5) chars[chars.length - 1] = 'gros';
      // Les élastiques aiment les murs : colonne collée à un bord.
      const x = chars.includes('elastique') ? (rng.next() < 0.5 ? 40 : WORLD_W - 40) : cx;
      return colonne(ctx, t, x, inject(chars, force));
    }
    case 'v':
      return vForm(ctx, t, cx, inject(members(rng, p, rng.int(5, 7)), force));
    case 'escorte':
      return escorte(ctx, t, cx, rng.int(2, 4));
    case 'piege':
      return escorte(ctx, t, cx, rng.int(3, 4), 'gros');
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

/** Vitesse de chute effective : un chaton d'escorte tombe à la vitesse de son meneur. */
function speedIn(sp: FormationSpawn, group: readonly FormationSpawn[]): number {
  const leader = sp.escortLocal !== undefined ? group[sp.escortLocal] : sp;
  return CHARACTERS[leader.char].fallSpeed;
}

interface Placed { x: number; tick: number; v: number; r: number; sway: number }

/**
 * Un chat de la nouvelle formation passe-t-il trop près d'un chat déjà en chute (même colonne) avant que
 * celui-ci sorte de l'écran ? Les chats apparaissent tous en haut et tombent à vitesse constante : l'écart
 * vertical d(t) = y_ancien − y_nouveau est linéaire, son minimum est donc à l'apparition du nouveau ou à la
 * sortie de l'ancien.
 */
function catchesUp(group: readonly FormationSpawn[], placed: readonly Placed[]): boolean {
  for (const sp of group) {
    const vn = speedIn(sp, group), rn = radiusOf(sp.char);
    for (const o of placed) {
      if (sp.tick < o.tick) continue;
      if (Math.abs(sp.x - o.x) >= rn + o.r + sp.swayAmp + o.sway + 2) continue;
      const tExit = o.tick + (SEC * (WORLD_H + 2 * o.r)) / o.v;
      if (sp.tick >= tExit) continue;
      const d = (t: number) => (-o.r + (o.v * (t - o.tick)) / SEC) - (-rn + (vn * (t - sp.tick)) / SEC);
      if (Math.min(d(sp.tick), d(tExit)) < o.r + rn + 2) return true;
    }
  }
  return false;
}

/** Construit une formation ; la redessine (autre position) tant qu'elle passerait trop près d'un chat, 12 essais au plus. */
function placeWithoutCatchUp(build: () => FormationSpawn[], placed: Placed[]): FormationSpawn[] {
  let group = build();
  for (let tries = 0; tries < 12 && catchesUp(group, placed); tries++) group = build();
  for (const sp of group) placed.push({ x: sp.x, tick: sp.tick, v: speedIn(sp, group), r: radiusOf(sp.char), sway: sp.swayAmp });
  return group;
}

/** Mélange de Fisher–Yates piloté par le Rng de l'averse. */
function shuffled<T>(rng: Rng, items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** `trace` (facultatif) reçoit les formations placées, dans l'ordre : sert aux tests de structure. */
export function generateAverse(chapter: number, index: number, seed: number, trace?: Kind[]): AverseDef {
  const p = plan(chapter, index);
  // Le chapitre et le numéro entrent dans l'aléa : la même graine donne des averses différentes d'une case
  // à l'autre (sinon deux averses voisines aux réglages proches pouvaient sortir identiques).
  const rng = createRng((Math.imul(seed, 0x9e3779b1) ^ Math.imul(chapter, 0x85ebca6b) ^ Math.imul(index, 0xc2b2ae35)) >>> 0);
  const ctx: FormationCtx = { rng, chapter };
  const groups: FormationSpawn[][] = [];
  const end = seconds(p.durationS - 12);
  const half = end / 2;
  const kinds = kindsFor(p);
  // Place réservée à la finale (une grappe de 5–8, deux pour la Grande averse).
  const reserve = p.grande ? 13 : 6;
  // Densité croissante (§11) : 40 % des chats hors finale arrivent en première moitié, 60 % en seconde.
  const budget = p.cats - reserve;
  // Fantômes : seule la pelote les attrape (§8), chacun coûte donc une pelote. Isolés dans la pluie fine
  // et plafonnés (§12 : ~4 dans une Grande averse), sinon les 3 pattes deviennent impossibles.
  const ghostCap = p.pool.includes('fantome') ? (p.grande ? 4 : 3) : 0;
  let ghosts = 0;
  // La Grande averse montre toutes les formations du chapitre au moins une fois (§10).
  const mustPlace: Kind[] = p.grande ? shuffled(rng, [...new Set(kinds)]) : [];
  let introduced = false;
  // Tutoriel (§12) : la grappe qui fait découvrir le carambolage arrive tôt, entre 15 et 25 s.
  let tutorialGrappe = !p.tutorial;
  const placed: Placed[] = [];
  let t = seconds(0.5);

  while (t < end) {
    const first = t < half;
    const phaseEnd = first ? half : end;
    const remaining = Math.max(1, (first ? budget * 0.4 : budget) - countCats(groups));
    let group: FormationSpawn[];
    const at = Math.round(t); // ticks entiers
    if (!tutorialGrappe && t >= seconds(15)) {
      group = placeWithoutCatchUp(() => grappe(ctx, at, rng.range(120, WORLD_W - 120), ['tigre', 'tigre', 'tigre', 'tigre', 'tigre', 'tigre']), placed);
      trace?.push('grappe');
      tutorialGrappe = true;
    } else if (!mustPlace.length && rng.next() < (first ? 0.45 : 0.25)) {
      const chars = members(rng, p, rng.int(2, 3), ['chaton']);
      if (ghosts < ghostCap) { chars[0] = 'fantome'; ghosts++; }
      group = placeWithoutCatchUp(() => pluieFine(ctx, at, 4, chars), placed);
    } else {
      let kind: Kind = mustPlace.length ? mustPlace.shift()! : rng.pick(kinds);
      if (!introduced && p.newChar === 'maman' && kind !== 'escorte') {
        if (p.grande) mustPlace.unshift(kind); // la formation obligatoire n'est que reportée
        kind = 'escorte';
      }
      const k = kind;
      // Le nouveau caractère se montre dès la première formation de son chapitre (§13).
      const force: CharacterId | undefined = !introduced && p.newChar !== 'tigre' && !PLACED_APART.includes(p.newChar) && p.pool.includes(p.newChar) ? p.newChar : undefined;
      group = placeWithoutCatchUp(() => buildFormation(ctx, p, k, at, force), placed);
      trace?.push(kind);
      if (!introduced) introduced = !force || group.some(sp => sp.char === p.newChar);
    }
    groups.push(group);
    // L'écart suivant étale le budget restant de la phase sur le temps restant, sans trou de plus de 8 s.
    const gap = (group.length * (phaseEnd - t)) / remaining;
    t += Math.min(seconds(8), Math.max(seconds(3), gap));
  }
  if (ghostCap > 0 && ghosts === 0) groups.push(placeWithoutCatchUp(() => pluieFine(ctx, seconds(2), 3, ['fantome']), placed));
  // Finale garantie dans les 10 dernières secondes : grappe (ou escorte au chapitre 10).
  const finaleT = Math.round(Math.max(t, seconds(p.durationS - 11)));
  const finale: Kind = p.pool.includes('maman') && rng.next() < 0.5 ? 'escorte' : 'grappe';
  groups.push(placeWithoutCatchUp(() => buildFormation(ctx, p, finale, finaleT), placed));
  if (p.grande) groups.push(placeWithoutCatchUp(() => buildFormation(ctx, p, 'grappe', finaleT + seconds(3)), placed));

  const spawns = assemble(...groups);
  const catchable = spawns.filter(sp => CHARACTERS[sp.char].catchable).length;
  return {
    id: averseId(chapter, index),
    chapter,
    // 1-1 : stock généreux du tutoriel (§12) ; sinon 8 pelotes pour 30 chats attrapables (§7 loi 6).
    pelotes: p.tutorial ? 8 : Math.max(6, Math.round((catchable * 8) / 30)),
    spawns,
  };
}
