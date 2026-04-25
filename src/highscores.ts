// Highscores (local top 10)

export interface HighscoreEntry {
  name: string;
  score: number;
  date: number;
}

export function loadHighscores(): HighscoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem('pdc_hs') || '[]');
  } catch {
    return [];
  }
}

export function saveHighscores(list: HighscoreEntry[]): void {
  localStorage.setItem('pdc_hs', JSON.stringify(list.slice(0, 10)));
}

/** Demande le pseudo via un overlay HTML (mobile-friendly, pas de prompt() natif). */
function askPlayerName(score: number): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.getElementById('hs-name-overlay');
    const input = document.getElementById('hs-name-input') as HTMLInputElement | null;
    const ok = document.getElementById('hs-name-ok');
    const skip = document.getElementById('hs-name-skip');
    const scoreEl = document.getElementById('hs-name-score');
    if (!overlay || !input || !ok || !skip) {
      resolve(null);
      return;
    }
    if (scoreEl) scoreEl.textContent = `Score : ${score}`;
    input.value = '';
    overlay.classList.add('show');
    setTimeout(() => input.focus(), 50);

    const cleanup = () => {
      overlay.classList.remove('show');
      ok.removeEventListener('click', onOk);
      skip.removeEventListener('click', onSkip);
      input.removeEventListener('keydown', onKey);
    };
    const onOk = () => {
      const name = input.value.trim().slice(0, 12);
      cleanup();
      resolve(name || null);
    };
    const onSkip = () => {
      cleanup();
      resolve(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onOk();
      else if (e.key === 'Escape') onSkip();
    };
    ok.addEventListener('click', onOk);
    skip.addEventListener('click', onSkip);
    input.addEventListener('keydown', onKey);
  });
}

export async function maybeAddHighscore(score: number): Promise<boolean> {
  if (!score || score <= 0) return false;
  const list = loadHighscores();
  if (list.length >= 10 && score <= list[list.length - 1].score) return false;

  const rawName = await askPlayerName(score);
  const name = (rawName || 'anon').slice(0, 12);

  list.push({ name, score, date: Date.now() });
  list.sort((a, b) => b.score - a.score);
  saveHighscores(list);
  return true;
}

export function renderHighscores(): void {
  const list = loadHighscores();
  const el = document.getElementById('hs-list');
  if (!el) return;
  el.innerHTML = '';
  if (list.length === 0) {
    const row = document.createElement('div');
    row.className = 'hs-row empty';
    row.textContent = 'Aucun score pour le moment';
    el.appendChild(row);
    return;
  }
  list.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'hs-row';
    row.innerHTML = `<span class="hs-rank">#${i + 1}</span><span class="hs-name">${entry.name}</span><span class="hs-score">${entry.score}</span>`;
    el.appendChild(row);
  });
}
