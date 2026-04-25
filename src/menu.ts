// @ts-nocheck
// ── Menu handlers ─────────────────────────────────────────────────────────
export const startMenu = document.getElementById('start-menu-overlay');
export const hsOverlay = document.getElementById('highscores-overlay');
export function openStartMenu() { state.menuActive = true; startMenu.classList.add('show'); }
export function closeStartMenu() { state.menuActive = false; startMenu.classList.remove('show'); }

document.getElementById('play-btn').addEventListener('click', () => {
  if (!Music.on) {
    Music.start();
    document.getElementById('music-btn').textContent = '🎵';
    document.getElementById('menu-music-icon').textContent = '🎵';
  }
  closeStartMenu();
  if (state.gameOver) resetGame();
});
document.getElementById('menu-bestiary-btn').addEventListener('click', () => {
  buildBestiary();
  document.getElementById('bestiary-overlay').classList.add('show');
});
document.getElementById('menu-highscores-btn').addEventListener('click', () => {
  renderHighscores();
  hsOverlay.classList.add('show');
});
document.getElementById('menu-music-btn').addEventListener('click', () => {
  Music.toggle();
  document.getElementById('menu-music-icon').textContent = Music.on ? '🎵' : '🔇';
  document.getElementById('music-btn').textContent = Music.on ? '🎵' : '🔇';
});
document.getElementById('hs-close').addEventListener('click', () => hsOverlay.classList.remove('show'));
hsOverlay.addEventListener('click', e => { if (e.target.id === 'highscores-overlay') hsOverlay.classList.remove('show'); });

document.getElementById('replay-btn').addEventListener('click', () => {
  document.getElementById('gameover-overlay').classList.remove('show');
  resetGame();
});
document.getElementById('go-menu-btn').addEventListener('click', () => {
  document.getElementById('gameover-overlay').classList.remove('show');
  resetGame();
  openStartMenu();
});
document.getElementById('bestiary-btn').addEventListener('click', ()=>{ buildBestiary(); document.getElementById('bestiary-overlay').classList.add('show'); });
document.getElementById('bst-close').addEventListener('click', ()=>{ document.getElementById('bestiary-overlay').classList.remove('show'); });
document.getElementById('bst-detail-close').addEventListener('click', ()=>{ document.getElementById('bst-detail-overlay').classList.remove('show'); });
document.getElementById('bst-detail-overlay').addEventListener('click', (e)=>{ if (e.target.id === 'bst-detail-overlay') e.target.classList.remove('show'); });
updateHUD();
requestAnimationFrame(loop);
