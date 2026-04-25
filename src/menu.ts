// Menu handlers + overlays (start menu, bestiary, highscores, gameover)
import { resetGame } from './effects';
import { renderHighscores } from './highscores';
import { buildBestiary } from './bestiary';
import { Music } from './audio';
import { state } from './state';
import { startMenuScene, stopMenuScene } from './menu-scene';

export const startMenu = document.getElementById('start-menu-overlay')!;
export const hsOverlay = document.getElementById('highscores-overlay')!;

// La scène menu démarre dès le chargement (overlay affiché par défaut via class="show")
startMenuScene();

export function openStartMenu(): void {
  state.menuActive = true;
  startMenu.classList.add('show');
  startMenuScene();
}

export function closeStartMenu(): void {
  state.menuActive = false;
  startMenu.classList.remove('show');
  stopMenuScene();
}

function bind(id: string, ev: string, fn: (e: Event) => void): void {
  const el = document.getElementById(id);
  if (el) el.addEventListener(ev, fn);
}

bind('play-btn', 'click', () => {
  if (!Music.on) {
    Music.start();
    const mb = document.getElementById('music-btn');
    if (mb) mb.textContent = '🎵';
    const mmi = document.getElementById('menu-music-icon');
    if (mmi) mmi.textContent = '🎵';
  }
  closeStartMenu();
  if (state.gameOver) resetGame();
});

bind('menu-bestiary-btn', 'click', () => {
  buildBestiary();
  document.getElementById('bestiary-overlay')?.classList.add('show');
});

bind('menu-highscores-btn', 'click', () => {
  renderHighscores();
  hsOverlay.classList.add('show');
});

bind('menu-music-btn', 'click', () => {
  Music.toggle();
  const mmi = document.getElementById('menu-music-icon');
  if (mmi) mmi.textContent = Music.on ? '🎵' : '🔇';
  const mb = document.getElementById('music-btn');
  if (mb) mb.textContent = Music.on ? '🎵' : '🔇';
});

bind('hs-close', 'click', () => hsOverlay.classList.remove('show'));
hsOverlay.addEventListener('click', e => {
  if ((e.target as HTMLElement).id === 'highscores-overlay') hsOverlay.classList.remove('show');
});

bind('replay-btn', 'click', () => {
  document.getElementById('gameover-overlay')?.classList.remove('show');
  resetGame();
});

bind('go-menu-btn', 'click', () => {
  document.getElementById('gameover-overlay')?.classList.remove('show');
  resetGame();
  openStartMenu();
});

bind('bestiary-btn', 'click', () => {
  buildBestiary();
  document.getElementById('bestiary-overlay')?.classList.add('show');
});

bind('bst-close', 'click', () => {
  document.getElementById('bestiary-overlay')?.classList.remove('show');
});

bind('bst-detail-close', 'click', () => {
  document.getElementById('bst-detail-overlay')?.classList.remove('show');
});

document.getElementById('bst-detail-overlay')?.addEventListener('click', e => {
  if ((e.target as HTMLElement).id === 'bst-detail-overlay') {
    (e.target as HTMLElement).classList.remove('show');
  }
});

// ── HUD burger menu (en jeu) ─────────────────────────────────────────────
const hudPanel = document.getElementById('hud-menu-panel');
const hudMenuMusicIcon = document.getElementById('hud-menu-music-icon');

function refreshMusicIcons(): void {
  const icon = Music.on ? '🎵' : '🔇';
  if (hudMenuMusicIcon) hudMenuMusicIcon.textContent = icon;
  const mb = document.getElementById('music-btn');
  if (mb) mb.textContent = icon;
  const mmi = document.getElementById('menu-music-icon');
  if (mmi) mmi.textContent = icon;
}

function closeHudPanel(): void {
  hudPanel?.classList.remove('show');
}

bind('hud-menu-btn', 'click', e => {
  e.stopPropagation();
  hudPanel?.classList.toggle('show');
  refreshMusicIcons();
});
bind('hud-menu-music', 'click', () => {
  Music.toggle();
  refreshMusicIcons();
});
bind('hud-menu-bestiary', 'click', () => {
  closeHudPanel();
  buildBestiary();
  document.getElementById('bestiary-overlay')?.classList.add('show');
});
bind('hud-menu-highscores', 'click', () => {
  closeHudPanel();
  renderHighscores();
  hsOverlay.classList.add('show');
});
// Click hors panel = ferme
document.addEventListener('click', e => {
  if (!hudPanel?.classList.contains('show')) return;
  const t = e.target as HTMLElement;
  if (t.closest('#hud-menu-panel') || t.closest('#hud-menu-btn')) return;
  closeHudPanel();
});
