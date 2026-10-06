// Client jouable P1 (GAME_SPEC §28). La sim n'est modifiée que par tryShoot et step.
// Boucle : accumulateur temps réel → step à 120 Hz, au plus 10 ticks par image. Le ralenti et
// l'accéléré changent le nombre de ticks par seconde réelle, jamais la physique.

import {
  ANGLE_MAX, ANGLE_MIN, CHARACTERS, DT, HANDMADE, WORLD_H, catchableCount, createSim, drainEvents,
  finalScore, handmadeById, hashState, predictFirstContact, runReplay, stars, step, tryShoot,
} from '../sim';
import type { AverseDef, InputLog, SimEvent, SimState } from '../sim';
import { loadAssets } from './assets';
import type { Assets } from './assets';
import { bark, chainNote, chime, tink, unlockAudio } from './audio';
import { burst, createFx, floatText, queueBanner, shake, spark, stamp, updateFx } from './fx';
import type { Fx } from './fx';
import { bindDom } from './hud';
import { attachInput } from './input';
import { BANNER_ICON, THEME } from './look';
import { render, updateLooks } from './render';
import type { AimState, CatLook } from './render';
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

interface Run {
  averse: AverseDef;
  sim: SimState;
  assets: Assets;
  catchable: number;
  looks: Map<number, CatLook>;
  fx: Fx;
  acc: number;
  aim: AimState | null;
  blinkUntil: number;
  slowUntil: number;
  fast: boolean;
  endedAt: number | null;
  endShown: boolean;
  spawnSeen: number;
  seenChars: Set<string>;
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
// Outils de débogage (oracle de chaîne, état modifiable) : jamais dans le build publié.
// Activés seulement en dev ou dans un build de test (VITE_DEBUG=1, utilisé par Playwright), et avec ?debug.
const DEBUG = (import.meta.env.DEV || import.meta.env.VITE_DEBUG === '1') && params.has('debug');
const AVERSE_IDS = HANDMADE.map(a => a.id);
let averseId = AVERSE_IDS.includes(params.get('averse') ?? '') ? (params.get('averse') as string) : 'h1';

const dom = bindDom({
  onFinish() {
    if (run && canFinish(run.sim)) run.fast = true;
  },
  onReplay() {
    launch(averseId);
  },
  onNext() {
    const i = AVERSE_IDS.indexOf(averseId);
    averseId = AVERSE_IDS[(i + 1) % AVERSE_IDS.length];
    const url = new URL(location.href);
    url.searchParams.set('averse', averseId);
    history.replaceState(null, '', url);
    launch(averseId);
  },
});

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

let run: Run | null = null;
let now = performance.now();

async function start(id: string): Promise<void> {
  const averse = handmadeById(id);
  if (!averse) throw new Error(`Averse inconnue : ${id}`);
  const assets = await loadAssets(averse);
  run = {
    averse, assets,
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
    spawnSeen: 0,
    seenChars: new Set(),
  };
  dom.hideEnd();
}

// ── Événements de la sim → retours visuels et sonores ───────────────────────

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
      break;
    default:
      break;
  }
}

function tick(r: Run): void {
  step(r.sim);
  // Bandeau à la première apparition d'un caractère non tigré (§13), sans pause.
  const spawns = r.averse.spawns;
  for (; r.spawnSeen < r.sim.nextSpawn; r.spawnSeen++) {
    const ch = spawns[r.spawnSeen].char;
    if (ch === 'tigre' || r.seenChars.has(ch)) continue;
    r.seenChars.add(ch);
    queueBanner(r.fx, BANNER_ICON[ch], CHARACTERS[ch].label, CHARACTERS[ch].rule);
  }
  for (const e of drainEvents(r.sim)) onEvent(r, e);
}

// ── Tir ──────────────────────────────────────────────────────────────────────

function shoot(r: Run, angleDeci: number): string {
  const res = tryShoot(r.sim, angleDeci);
  if (res === 'cooldown' || res === 'empty') r.blinkUntil = now + BLINK_MS;
  return res;
}

attachInput(cv, () => view, {
  onGesture: unlockAudio,
  onAim(wx, wy) {
    if (!run || run.sim.ended) return;
    run.aim = { wx, wy, angle: aimAngleDeci(wx, wy), pred: null };
  },
  onRelease(wx, wy) {
    if (!run) return;
    run.aim = null;
    const a = aimAngleDeci(wx, wy);
    if (a === null || run.sim.ended) return; // sous 7° : annulé, rien n'est consommé
    shoot(run, a);
  },
  onCancel() {
    if (run) run.aim = null;
  },
});

// ── Boucle ───────────────────────────────────────────────────────────────────

let last: number | null = null;
document.addEventListener('visibilitychange', () => {
  last = null; // à la reprise, aucun rattrapage du temps passé caché
  if (document.hidden && run) run.aim = null;
});

function frame(t: number): void {
  requestAnimationFrame(frame);
  now = t;
  if (document.hidden) {
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
  updateFx(r.fx, visDt);

  if (r.aim && r.aim.angle !== null) r.aim.pred = predictFirstContact(r.sim, r.aim.angle);

  render(g, view, dpr, {
    sim: r.sim, assets: r.assets, looks: r.looks, fx: r.fx, aim: r.aim,
    blink: t < r.blinkUntil && Math.floor(t / 90) % 2 === 0,
    time: t / 1000,
    catchable: r.catchable,
    fast: r.fast,
  });

  dom.placeFinish(view, !r.fast && canFinish(r.sim));

  if (r.sim.ended && !r.endShown && r.endedAt !== null && t >= r.endedAt + END_DELAY_MS && t >= r.slowUntil) {
    r.endShown = true;
    dom.showEnd({
      stars: stars(r.sim),
      score: finalScore(r.sim),
      bestChain: r.sim.bestChain,
      caught: r.sim.caught,
      catchable: r.catchable,
      pelotesLeft: r.sim.pelotes,
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
      const averse = handmadeById(id);
      if (!averse) throw new Error(`Averse inconnue : ${id}`);
      const res = runReplay(averse, log);
      return { hash: hashState(res.state), score: finalScore(res.state), valid: res.valid };
    },
  };
}

// ── Démarrage ────────────────────────────────────────────────────────────────

void document.fonts?.load(`800 20px "Baloo 2"`).catch(() => undefined);
void document.fonts?.load(`600 14px "Fredoka"`).catch(() => undefined);

start(averseId)
  .then(() => (DEBUG ? exposeDebug() : undefined))
  .catch((err: unknown) => {
    dom.showError(err instanceof Error ? err.message : String(err));
    throw err;
  });
requestAnimationFrame(frame);
