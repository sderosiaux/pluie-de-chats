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

export function maybeAddHighscore(score: number): boolean {
  if (!score || score <= 0) return false;
  const list = loadHighscores();
  if (list.length >= 10 && score <= list[list.length - 1].score) return false;
  let name = (prompt('Nouveau highscore ! Ton pseudo (max 12 chars)') || '').trim().slice(0, 12);
  if (!name) name = 'anon';
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
