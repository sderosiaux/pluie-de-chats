import { WEAPON_SPRITES } from './sprites';
import { PROJ_DEFS } from './data';
import { state, pendingWeaponReveals } from './state';
import type { ProjDef } from './types';
import { checkLevelUp } from './levelup';

const overlay = document.getElementById('weapon-reveal-overlay') as HTMLElement | null;
const card    = document.getElementById('wr-card') as HTMLElement | null;
const okBtn   = document.getElementById('wr-ok') as HTMLButtonElement | null;

okBtn?.addEventListener('click', dismissCurrent);

function dismissCurrent(): void {
  overlay?.classList.remove('show');
  state.weaponRevealPaused = false;
  if (pendingWeaponReveals.length) {
    setTimeout(processQueue, 60);
  } else {
    // Reveal terminé : laisse passer un éventuel level-up qu'on avait gelé
    setTimeout(checkLevelUp, 60);
  }
}

function processQueue(): void {
  if (state.weaponRevealPaused) return;
  const wid = pendingWeaponReveals.shift();
  if (!wid) return;
  const def = (PROJ_DEFS as any)[wid] as ProjDef | undefined;
  if (!def) return;
  renderCard(wid, def);
  state.weaponRevealPaused = true;
  overlay?.classList.add('show');
}

function renderCard(wid: string, def: ProjDef): void {
  if (!card) return;
  card.className = 'lu-reveal';
  card.innerHTML = '';

  const tag = document.createElement('div');
  tag.className = 'lu-reveal-tag';
  tag.textContent = '🎁 Nouvelle arme';

  const head = document.createElement('div');
  head.className = 'lu-reveal-head';
  const spr = WEAPON_SPRITES[wid];
  if (spr && spr.complete && spr.naturalWidth > 0) {
    const cvs = document.createElement('canvas');
    cvs.width = 72; cvs.height = 72;
    cvs.getContext('2d')!.drawImage(spr, 0, 0, 72, 72);
    head.appendChild(cvs);
  } else {
    const em = document.createElement('div');
    em.style.cssText = 'font-size:54px;line-height:1';
    em.textContent = def.emoji;
    head.appendChild(em);
  }
  const name = document.createElement('div');
  name.className = 'lu-reveal-name';
  name.textContent = def.label;
  head.appendChild(name);

  card.append(tag, head);

  if (def.usage) {
    const row = document.createElement('div');
    row.className = 'lu-reveal-row';
    row.innerHTML = `<span class="lu-reveal-icon">🎯</span><span><b>Comment :</b> ${def.usage}</span>`;
    card.appendChild(row);
  }
  if (def.tip) {
    const row = document.createElement('div');
    row.className = 'lu-reveal-row';
    row.innerHTML = `<span class="lu-reveal-icon">💡</span><span><b>Astuce :</b> ${def.tip}</span>`;
    card.appendChild(row);
  }
}

export function queueWeaponReveal(wid: string): void {
  pendingWeaponReveals.push(wid);
  if (!state.weaponRevealPaused) processQueue();
}
