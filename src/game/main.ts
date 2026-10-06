// Client (GAME_SPEC §21, §28). La sim n'est modifiée que par tryShoot et step.
// Trois écrans : carte des averses (accueil), carnet, jeu. La sim n'avance que sur l'écran de jeu,
// onglet visible (§30.9). Boucle : accumulateur temps réel → step à 120 Hz, au plus 10 ticks par image.
// Le ralenti et l'accéléré changent le nombre de ticks par seconde réelle, jamais la physique.

import {
  ANGLE_MAX, ANGLE_MIN, CHARACTERS, DT, WORLD_H, catchableCount, createSim, drainEvents,
  finalScore, handmadeById, hashState, predictFirstContact, runReplay, stars, step, tryShoot,
} from '../sim';
import type { AverseDef, InputLog, SimEvent, SimState } from '../sim';
import { loadAssets } from './assets';
import type { Assets } from './assets';
import { bark, chainNote, chime, setSoundEnabled, tink, unlockAudio } from './audio';
import {
  averseFor, isPlayable, isUnlocked, nextSlot, parseSlot, rareCostumesEnabled, rareCostumesFor, slotId,
} from './campaign';
import type { Slot } from './campaign';
import { burst, createFx, floatText, queueBanner, shake, spark, stamp, updateFx } from './fx';
import type { Fx } from './fx';
import { bindDom } from './hud';
import { attachInput } from './input';
import { BANNER_ICON, THEME } from './look';
import {
  STORAGE_KEY, emptyProgress, loadProgress, markRead, meet, mergeProgress, parseProgress, recordResult, saveProgress, seeCostume, withSound,
} from './progress';
import type { Progress } from './progress';
import { render, updateLooks } from './render';
import type { AimState, CatLook } from './render';
import { averseLabel, bindScreens } from './screens';
import type { Paused } from './screens';
import { aimAngleDeci, fitView } from './view';
import type { View } from './view';

const MAX_TICKS_PER_FRAME = 10;
const SLOWMO_SCALE = 0.5;
const SLOWMO_MS = 600;
const SLOWMO_AT = 5; // 5ᵉ capture d'une chaîne (§18)
const FAST_SCALE = 8; // « Finir l'averse » : plafonné par MAX_TICKS_PER_FRAME (×5 à 60 Hz)
const BLINK_MS = 450;
const END_DELAY_MS = 900; // laisse lire le dernier « Carambolage » avant l'écran de fin
const MAX_FRAME_S = 0.1;

type Screen = 'map' | 'carnet' | 'play';

/** Ce que la fin d'averse a changé dans la progression (calculé quand la sim se termine). */
interface Outcome {
  next: string | null;
  unlocked: string | null;
  record: boolean;
}

interface Run {
  averse: AverseDef;
  /** Averse de campagne (progression, carnet, costumes rares) ; null = averse de débogage (h1…). */
  slot: Slot | null;
  sim: SimState;
  assets: Assets;
  catchable: number;
  rare: ReadonlyMap<number, string>;
  looks: Map<number, CatLook>;
  fx: Fx;
  acc: number;
  aim: AimState | null;
  blinkUntil: number;
  slowUntil: number;
  fast: boolean;
  endedAt: number | null;
  endShown: boolean;
  outcome: Outcome | null;
  spawnSeen: number;
  seenChars: Set<string>; // averses de débogage : bandeau par partie, sans persistance
}

// ── DOM et vue ───────────────────────────────────────────────────────────────

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('#game absent de index.html');
const ctx2d = canvas.getContext('2d');
if (!ctx2d) throw new Error('Canvas 2D indisponible');
const g: CanvasRenderingContext2D = ctx2d;
const cv: HTMLCanvasElement = canvas;

let view: View = fitView(window.innerWidth, window.innerHeight);
let dpr = 1;
function resize(): void {
  view = fitView(window.innerWidth, window.innerHeight);
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(view.width * dpr);
  cv.height = Math.round(view.height * dpr);
  cv.style.width = `${view.width}px`;
  cv.style.height = `${view.height}px`;
}
resize();
window.addEventListener('resize', resize);

const params = new URLSearchParams(location.search);
// Outils de débogage (oracle de chaîne, état modifiable, averses h1–h3) : jamais dans le build publié.
// Activés seulement en dev ou dans un build de test (VITE_DEBUG=1, utilisé par Playwright), et avec ?debug.
const DEBUG = (import.meta.env.DEV || import.meta.env.VITE_DEBUG === '1') && params.has('debug');

// ── Progression ─────────────────────────────────────────────────────────────

function localStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // accès refusé : on joue sans sauvegarde
  }
}
const storage = localStore();
let progress: Progress = loadProgress(storage);
setSoundEnabled(progress.sound);

let saveWarned = false;

/**
 * Enregistre en fusionnant avec ce qu'un autre onglet a pu écrire entre-temps : sinon l'état en mémoire,
 * périmé, écraserait ses pattes. Un échec d'écriture (quota, navigation privée) est signalé une fois.
 */
function commit(p: Progress): void {
  if (p === progress) return;
  progress = mergeProgress(loadProgress(storage), p);
  if (!saveProgress(storage, progress) && storage && !saveWarned) {
    saveWarned = true;
    dom.showError('Sauvegarde impossible sur cet appareil : ta progression sera perdue en fermant la page.', 6000);
  }
}

// Un autre onglet a progressé : on fusionne et on redessine l'écran ouvert.
window.addEventListener('storage', e => {
  if (e.key !== STORAGE_KEY) return;
  progress = mergeProgress(progress, loadProgress(storage));
  if (screen === 'map') screens.showMap(progress, paused());
  else if (screen === 'carnet') screens.refreshCarnet(progress);
});

// ── Écrans ──────────────────────────────────────────────────────────────────

let screen: Screen = 'map';
let run: Run | null = null;
let now = performance.now();

const dom = bindDom({
  onFinish() {
    if (run && canFinish(run.sim)) run.fast = true;
  },
  onReplay() {
    if (run) launch(run.averse.id);
  },
  onNext() {
    const next = run?.outcome?.next;
    if (next) launch(next);
  },
  onMap: openMap,
});

const screens = bindScreens({
  onPlay: launch,
  onResume() {
    startToken++; // annule un lancement encore en chargement
    if (!run || run.sim.ended) return openMap();
    showPlay(run.averse.id);
  },
  onOpenCarnet() {
    startToken++; // annule un lancement encore en chargement : il refermerait le carnet
    screen = 'carnet';
    screens.showCarnet(progress);
  },
  onCloseCarnet: openMap,
  onSound(on) {
    commit(withSound(progress, on));
    setSoundEnabled(on);
    if (on) unlockAudio(); // geste utilisateur : le contexte audio peut naître ici
    screens.showMap(progress, paused());
  },
  onReadPage(ch) {
    commit(markRead(progress, ch));
    screens.refreshCarnet(progress);
  },
});

/** Averse en cours, mise en pause par l'ouverture de la carte. */
function paused(): Paused | null {
  if (!run || run.sim.ended) return null;
  return { id: run.averse.id, label: run.slot ? averseLabel(run.slot) : `Averse ${run.averse.id}` };
}

function setUrlAverse(id: string | null): void {
  const url = new URL(location.href);
  if (id === null) url.searchParams.delete('averse');
  else url.searchParams.set('averse', id);
  history.replaceState(null, '', url);
}

function openMap(): void {
  startToken++; // annule un lancement encore en chargement : il masquerait la carte
  screen = 'map';
  if (run) run.aim = null;
  dom.hideEnd();
  dom.placeButtons(view, false, false);
  screens.showMap(progress, paused());
  setUrlAverse(null);
}

function showPlay(id: string): void {
  screen = 'play';
  last = null; // aucun rattrapage du temps passé sur la carte
  screens.hide();
  setUrlAverse(id);
}

/**
 * « Finir l'averse » n'a de sens que si plus rien ne peut rendre une pelote : stock vide, aucune pelote
 * en vol et aucune chaîne active (une chaîne ≥ 4 encore en cours rendrait une pelote, §7 loi 5).
 */
function canFinish(s: SimState): boolean {
  return !s.ended && s.pelotes === 0 && s.balls.length === 0 && s.chains.length === 0;
}

/** Démarre une averse ; un échec (asset introuvable…) s'affiche au lieu de devenir une promesse rejetée muette. */
function launch(id: string): void {
  start(id).catch((err: unknown) => dom.showError(err instanceof Error ? err.message : String(err)));
}

/** Averse jouable pour cet id : campagne débloquée, ou averse à la main en mode débogage. */
function resolve(id: string): { averse: AverseDef; slot: Slot | null } | null {
  const slot = parseSlot(id);
  if (slot) {
    const averse = isPlayable(progress, slot) ? averseFor(slot) : undefined;
    return averse ? { averse, slot } : null;
  }
  const averse = DEBUG ? handmadeById(id) : undefined;
  return averse ? { averse, slot: null } : null;
}

let startToken = 0;

async function start(id: string): Promise<void> {
  const token = ++startToken;
  const found = resolve(id);
  if (!found) throw new Error(`Averse indisponible : ${id}`);
  const { averse, slot } = found;
  const rare = slot ? rareCostumesFor(averse, rareCostumesEnabled(progress)) : new Map<number, string>();
  const assets = await loadAssets(averse, rare.values());
  if (token !== startToken) return; // un autre lancement est passé devant
  run = {
    averse, slot, assets, rare,
    sim: createSim(averse),
    catchable: catchableCount(averse),
    looks: new Map(),
    fx: createFx(),
    acc: 0,
    aim: null,
    blinkUntil: 0,
    slowUntil: 0,
    fast: false,
    endedAt: null,
    endShown: false,
    outcome: null,
    spawnSeen: 0,
    seenChars: new Set(),
  };
  dom.hideEnd();
  dom.hideError();
  showPlay(id);
}

// ── Événements de la sim → retours visuels, sonores, progression ────────────

function onEvent(r: Run, e: SimEvent): void {
  const fx = r.fx;
  switch (e.type) {
    case 'catch':
      burst(fx, e.x, e.y, 10, THEME.particles);
      floatText(fx, e.x, e.y - 28, `×${e.n}`, { size: 17 + Math.min(e.n, 10) * 1.5 });
      chainNote(e.n);
      if (e.n === SLOWMO_AT) r.slowUntil = now + SLOWMO_MS;
      break;
    case 'chainEnd':
      if (e.n >= 2) {
        stamp(fx, e.n, e.points);
        shake(fx, Math.min(14, 2 * e.n));
      }
      if (e.refund) {
        floatText(fx, 64, WORLD_H - 46, '+1 🧶', { size: 18, life: 1.3, vy: -22 });
        chime();
      }
      break;
    case 'dog':
      burst(fx, e.x, e.y, 12, ['#c9a27c', '#e8d5c0', '#ffffff']);
      floatText(fx, e.x, e.y - 28, 'WAF −5', { size: 22, color: THEME.danger, life: 1.2 });
      bark();
      break;
    case 'shield':
      spark(fx, e.x, e.y);
      tink();
      break;
    case 'dodge': {
      const l = r.looks.get(e.catId);
      if (l) l.tro = 0.2;
      break;
    }
    case 'miss':
      floatText(fx, Math.min(330, Math.max(30, e.x)), WORLD_H - 58, 'raté', { size: 13, color: THEME.inkSoft, weight: 600, life: 0.8, vy: -14 });
      break;
    case 'end':
      r.endedAt = now;
      r.outcome = settle(r);
      break;
    default:
      break;
  }
}

/** Fin d'averse : la progression est enregistrée tout de suite, bien avant l'écran de fin (§22). */
function settle(r: Run): Outcome {
  if (!r.slot) return { next: null, unlocked: null, record: false };
  const id = slotId(r.slot);
  const next = nextSlot(r.slot);
  const wasOpen = next !== null && isUnlocked(progress, next);
  const before = progress.averses[id];
  const score = finalScore(r.sim);
  commit(recordResult(progress, id, { stars: stars(r.sim), score, chain: r.sim.bestChain }));
  const playable = next !== null && isPlayable(progress, next);
  return {
    next: playable ? slotId(next) : null,
    unlocked: playable && !wasOpen ? slotId(next) : null,
    record: before !== undefined && score > before.score,
  };
}

/** Un chat entre en scène : carnet (caractère, costume) et carte de caractère à la toute première rencontre (§13). */
function discover(r: Run, spawnIdx: number): void {
  const sp = r.averse.spawns[spawnIdx];
  const ch = sp.char;
  const banner = (): void => queueBanner(r.fx, BANNER_ICON[ch], CHARACTERS[ch].label, CHARACTERS[ch].rule);
  if (!r.slot) {
    if (ch !== 'tigre' && !r.seenChars.has(ch)) banner();
    r.seenChars.add(ch);
    return;
  }
  // Le tigré est la référence, sans règle à annoncer : il entre au carnet sans bandeau.
  if (ch !== 'tigre' && !progress.met.includes(ch)) banner();
  commit(seeCostume(meet(progress, ch), ch, r.rare.get(spawnIdx) ?? sp.costume));
}

function tick(r: Run): void {
  step(r.sim);
  for (; r.spawnSeen < r.sim.nextSpawn; r.spawnSeen++) discover(r, r.spawnSeen);
  for (const e of drainEvents(r.sim)) onEvent(r, e);
}

// ── Tir ──────────────────────────────────────────────────────────────────────

function shoot(r: Run, angleDeci: number): string {
  const res = tryShoot(r.sim, angleDeci);
  if (res === 'cooldown' || res === 'empty') r.blinkUntil = now + BLINK_MS;
  return res;
}

/** La partie accepte des entrées : écran de jeu, averse en cours. */
function playing(): Run | null {
  return screen === 'play' && run && !run.sim.ended ? run : null;
}

attachInput(cv, () => view, {
  onGesture: unlockAudio,
  onAim(wx, wy) {
    const r = playing();
    if (r) r.aim = { wx, wy, angle: aimAngleDeci(wx, wy), pred: null };
  },
  onRelease(wx, wy) {
    if (run) run.aim = null;
    const r = playing();
    const a = aimAngleDeci(wx, wy);
    if (!r || a === null) return; // sous 7° (ou hors du monde, sous le lanceur) : annulé, rien n'est consommé
    shoot(r, a);
  },
  onCancel() {
    if (run) run.aim = null;
  },
});

// ── Boucle ───────────────────────────────────────────────────────────────────

let last: number | null = null;
let pageHidden = document.visibilityState === 'hidden';
document.addEventListener('visibilitychange', () => {
  pageHidden = document.visibilityState === 'hidden';
  last = null; // à la reprise, aucun rattrapage du temps passé caché
  if (pageHidden && run) run.aim = null;
});

function frame(t: number): void {
  requestAnimationFrame(frame);
  now = t;
  // §30.9 : rien n'avance sur la carte, dans le carnet ou onglet caché.
  if (pageHidden || screen !== 'play') {
    last = null;
    return;
  }
  const realDt = last === null ? 0 : Math.min(MAX_FRAME_S, (t - last) / 1000);
  last = t;
  const r = run;
  if (!r) return;

  const scale = r.fast ? FAST_SCALE : t < r.slowUntil ? SLOWMO_SCALE : 1;
  r.acc += realDt * scale;
  let ticks = Math.floor(r.acc / DT);
  if (ticks > MAX_TICKS_PER_FRAME) {
    ticks = MAX_TICKS_PER_FRAME;
    r.acc = 0;
  } else {
    r.acc -= ticks * DT;
  }
  for (let i = 0; i < ticks && !r.sim.ended; i++) tick(r);

  const visDt = r.fast ? ticks * DT : realDt * scale;
  updateLooks(r.sim, r.looks, visDt);
  updateFx(r.fx, visDt, realDt);

  if (r.aim && r.aim.angle !== null) r.aim.pred = predictFirstContact(r.sim, r.aim.angle);

  render(g, view, dpr, {
    sim: r.sim, assets: r.assets, looks: r.looks, fx: r.fx, aim: r.aim,
    blink: t < r.blinkUntil && Math.floor(t / 90) % 2 === 0,
    time: t / 1000,
    catchable: r.catchable,
    fast: r.fast,
    rare: r.rare,
  });

  dom.placeButtons(view, !r.fast && canFinish(r.sim), !r.endShown);

  if (r.sim.ended && !r.endShown && r.endedAt !== null && t >= r.endedAt + END_DELAY_MS && t >= r.slowUntil) {
    r.endShown = true;
    const o = r.outcome ?? { next: null, unlocked: null, record: false };
    dom.showEnd({
      averseLabel: r.slot ? averseLabel(r.slot) : `Averse ${r.averse.id}`,
      stars: stars(r.sim),
      score: finalScore(r.sim),
      bestChain: r.sim.bestChain,
      caught: r.sim.caught,
      catchable: r.catchable,
      pelotesLeft: r.sim.pelotes,
      next: o.next,
      unlocked: o.unlocked,
      record: o.record,
    });
  }
}

// ── Débogage (?debug uniquement) ────────────────────────────────────────────

export interface PdcDebug {
  sim: () => SimState;
  shoot: (angleDeci: number) => string;
  bestAngle: () => number | null;
  fastForward: (ticks: number) => void;
  replayHash: (averseId: string, log: InputLog) => { hash: string; score: number; valid: boolean };
  /** Progression remise à zéro (stockage compris). */
  resetProgress: () => void;
  /** Remplace la progression par un JSON sérialisé (même lecture tolérante qu'au chargement). */
  setProgress: (json: string) => void;
}

declare global {
  interface Window {
    __pdc?: PdcDebug;
  }
}

function current(): Run {
  if (!run) throw new Error('Averse pas encore chargée');
  return run;
}

function replaceProgress(p: Progress): void {
  progress = p;
  saveProgress(storage, p);
  setSoundEnabled(p.sound);
  if (screen === 'map') screens.showMap(progress, paused());
  else if (screen === 'carnet') screens.showCarnet(progress);
}

async function exposeDebug(): Promise<void> {
  // Import dynamique : les bots ne font pas partie du bundle normal.
  const { evaluateShot } = await import('../bots/bots');
  window.__pdc = {
    sim: () => current().sim,
    shoot: a => shoot(current(), a),
    bestAngle: () => {
      // Comme la ligne de visée : le tir tel qu'il partirait maintenant, recharge et stock mis à part.
      const s = { ...current().sim, cooldown: 0, pelotes: Math.max(1, current().sim.pelotes) };
      let best: number | null = null, bestN = 0;
      for (let a = ANGLE_MIN; a <= ANGLE_MAX; a += 25) {
        const n = evaluateShot(s, a).n;
        if (n > bestN) { bestN = n; best = a; }
      }
      return best;
    },
    fastForward: ticks => {
      const r = current();
      for (let i = 0; i < ticks && !r.sim.ended; i++) tick(r);
    },
    replayHash: (id, log) => {
      const slot = parseSlot(id);
      const averse = slot ? averseFor(slot) : handmadeById(id);
      if (!averse) throw new Error(`Averse inconnue : ${id}`);
      const res = runReplay(averse, log);
      return { hash: hashState(res.state), score: finalScore(res.state), valid: res.valid };
    },
    resetProgress: () => replaceProgress(emptyProgress()),
    setProgress: json => replaceProgress(parseProgress(json)),
  };
}

// ── Démarrage ────────────────────────────────────────────────────────────────

void document.fonts?.load(`800 20px "Baloo 2"`).catch(() => undefined);
void document.fonts?.load(`600 14px "Fredoka"`).catch(() => undefined);

/** `?averse=1-2` ouvre directement une averse débloquée ; sinon (ou si verrouillée) : la carte. */
async function boot(): Promise<void> {
  const requested = params.get('averse');
  if (requested !== null && resolve(requested)) await start(requested);
  else openMap();
}

boot()
  .catch((err: unknown) => {
    // Lancement direct raté (?averse=…) : on retombe sur la carte, avec le message, au lieu d'une page vide.
    openMap();
    dom.showError(err instanceof Error ? err.message : String(err));
  })
  .then(() => (DEBUG ? exposeDebug() : undefined));
requestAnimationFrame(frame);
