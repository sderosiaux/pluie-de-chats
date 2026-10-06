// HUD (§21) : barre de progression avec seuils 🐾, score, pelotes restantes (canvas, coordonnées monde),
// bouton « Finir l'averse » et écran de fin (DOM, au-dessus du canvas).

import { PELOTE_BONUS, STAR_THRESHOLDS, WORLD_H, WORLD_W } from '../sim';
import type { SimState } from '../sim';
import type { Assets } from './assets';
import { roundRect } from './fx';
import { THEME } from './look';
import type { View } from './view';

const BAR_X = 12, BAR_Y = 12, BAR_W = 236, BAR_H = 12;
const PELOTE_ICON = 16, PELOTE_STEP = 16, PELOTE_MAX_ICONS = 8;

export function drawHud(g: CanvasRenderingContext2D, sim: SimState, catchable: number, assets: Assets, fast: boolean): void {
  // Progression des chats attrapés.
  const ratio = catchable === 0 ? 0 : Math.min(1, sim.caught / catchable);
  g.fillStyle = THEME.paper;
  roundRect(g, BAR_X - 4, BAR_Y - 4, BAR_W + 8, BAR_H + 8, (BAR_H + 8) / 2);
  g.fill();
  g.fillStyle = THEME.progressTrack;
  roundRect(g, BAR_X, BAR_Y, BAR_W, BAR_H, BAR_H / 2);
  g.fill();
  if (ratio > 0) {
    g.fillStyle = THEME.progress;
    roundRect(g, BAR_X, BAR_Y, Math.max(BAR_H, BAR_W * ratio), BAR_H, BAR_H / 2);
    g.fill();
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const t of STAR_THRESHOLDS) {
    const x = BAR_X + BAR_W * t;
    g.fillStyle = THEME.paper;
    g.fillRect(x - 1, BAR_Y, 2, BAR_H);
    g.globalAlpha = ratio >= t ? 1 : 0.35;
    g.font = `13px ${THEME.fontText}`;
    g.fillText('🐾', x, BAR_Y + BAR_H + 12);
    g.globalAlpha = 1;
  }
  g.font = `600 11px ${THEME.fontText}`;
  g.fillStyle = THEME.inkSoft;
  g.textAlign = 'left';
  g.fillText(`${sim.caught}/${catchable}`, BAR_X + 2, BAR_Y + BAR_H + 12);

  // Score à droite.
  g.textAlign = 'right';
  g.font = `800 26px ${THEME.fontDisplay}`;
  g.lineJoin = 'round';
  g.lineWidth = 5;
  g.strokeStyle = THEME.paper;
  g.strokeText(String(sim.score), WORLD_W - 12, BAR_Y + 9);
  g.fillStyle = THEME.ink;
  g.fillText(String(sim.score), WORLD_W - 12, BAR_Y + 9);

  // Pelotes restantes, en bas à gauche.
  const n = sim.pelotes;
  const icons = n > PELOTE_MAX_ICONS ? PELOTE_MAX_ICONS - 1 : n;
  const y = WORLD_H - 22;
  for (let i = 0; i < icons; i++) {
    g.drawImage(assets.pelote, 10 + i * PELOTE_STEP, y - PELOTE_ICON / 2, PELOTE_ICON, PELOTE_ICON);
  }
  if (n > icons) {
    g.textAlign = 'left';
    g.font = `800 15px ${THEME.fontDisplay}`;
    g.fillStyle = THEME.ink;
    g.fillText(`+${n - icons}`, 12 + icons * PELOTE_STEP, y + 1);
  }
  if (n === 0) label(g, fast ? 'avance rapide ⏩' : 'plus de pelote', 10, y + 1);
}

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  g.textAlign = 'left';
  g.font = `600 13px ${THEME.fontText}`;
  g.lineJoin = 'round';
  g.lineWidth = 4;
  g.strokeStyle = THEME.paper;
  g.strokeText(text, x, y);
  g.fillStyle = THEME.ink;
  g.fillText(text, x, y);
}

// ── DOM ──────────────────────────────────────────────────────────────────────

function el<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Élément #${id} absent de index.html`);
  return e as T;
}

export interface EndInfo {
  stars: 0 | 1 | 2 | 3;
  score: number;
  bestChain: number;
  caught: number;
  catchable: number;
  pelotesLeft: number;
}

export interface Dom {
  placeFinish(view: View, visible: boolean): void;
  showEnd(info: EndInfo): void;
  hideEnd(): void;
  showError(msg: string): void;
}

export function bindDom(handlers: { onFinish(): void; onReplay(): void; onNext(): void }): Dom {
  const finish = el<HTMLButtonElement>('finish');
  const end = el<HTMLDivElement>('end');
  const replay = el<HTMLButtonElement>('replay');
  const next = el<HTMLButtonElement>('next');
  const paws = [...end.querySelectorAll<HTMLSpanElement>('.paw')];
  const score = el<HTMLSpanElement>('end-score');
  const chain = el<HTMLSpanElement>('end-chain');
  const caught = el<HTMLSpanElement>('end-caught');
  const bonus = el<HTMLSpanElement>('end-bonus');
  const title = el<HTMLHeadingElement>('end-title');
  const error = el<HTMLDivElement>('error');

  finish.addEventListener('click', () => handlers.onFinish());
  replay.addEventListener('click', () => handlers.onReplay());
  next.addEventListener('click', () => handlers.onNext());

  return {
    placeFinish(view, visible) {
      finish.hidden = !visible;
      if (!visible) return;
      const right = view.width - (view.offX + WORLD_W * view.scale) + 10 * view.scale;
      const bottom = view.height - (view.offY + WORLD_H * view.scale) + 8 * view.scale;
      finish.style.right = `${right}px`;
      finish.style.bottom = `${bottom}px`;
      finish.style.fontSize = `${Math.max(13, 15 * view.scale)}px`;
    },
    showEnd(info) {
      paws.forEach((p, i) => p.classList.toggle('on', i < info.stars));
      title.textContent = info.stars === 0 ? 'Pas encore de patte' : info.stars === 3 ? 'Averse parfaite' : 'Averse terminée';
      score.textContent = String(info.score);
      chain.textContent = `×${info.bestChain}`;
      caught.textContent = `${info.caught}/${info.catchable}`;
      bonus.textContent = info.pelotesLeft > 0 ? `dont ${PELOTE_BONUS * info.pelotesLeft} pour ${info.pelotesLeft} pelote${info.pelotesLeft > 1 ? 's' : ''} gardée${info.pelotesLeft > 1 ? 's' : ''}` : '';
      end.hidden = false;
      replay.focus({ preventScroll: true });
    },
    hideEnd() {
      end.hidden = true;
    },
    showError(msg) {
      error.textContent = msg;
      error.hidden = false;
    },
  };
}
