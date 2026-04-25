import { WEAPON_SPRITES } from './sprites';
import { luOverlay } from './dom';
import { updateHUD } from './catch';
import { checkUnlocks } from './unlock';
import { Music } from './audio';
import { state, rechargeTimers, upgradeFlags, unlockedTypes, pickCounts, pendingLevelUps } from './state';
import { TYPE_ORDER, LEVELS, type Level } from './config';
import { PROJ_DEFS, UPGRADES } from './data';
import type { Upgrade, ProjDef } from './types';

// Initialize recharge timers for known weapons
TYPE_ORDER.forEach(t => { rechargeTimers[t] = 0; });

export function checkLevelUp(): void {
  while (state.level < LEVELS.length && state.score >= LEVELS[state.level].threshold) {
    state.level++;
    pendingLevelUps.push({ lvl: state.level, def: LEVELS[state.level - 1] });
  }
  if (!state.levelUpPaused && pendingLevelUps.length) {
    const next = pendingLevelUps.shift()!;
    const prevUnlocked = new Set(unlockedTypes);
    checkUnlocks();
    const newWeapon = TYPE_ORDER.find(id => !prevUnlocked.has(id) && unlockedTypes.has(id));
    Music.sfxLevelUp();
    updateHUD();
    showLevelUpScreen(next.lvl, next.def, newWeapon ? (PROJ_DEFS as any)[newWeapon] : null);
  }
}

export function showLevelUpScreen(lvl: number, _levelDef: Level, newWeapon: ProjDef | null): void {
  const numEl = document.getElementById('lu-num');
  if (numEl) numEl.textContent = String(lvl);

  // Weapon unlock banner — sprite à la place de l'emoji
  const banner = document.getElementById('lu-unlock-banner');
  if (banner) {
    if (newWeapon) {
      banner.innerHTML = '';
      const txt1 = document.createElement('span');
      txt1.textContent = '🎁 NOUVEAU : ';
      const wId = Object.keys(PROJ_DEFS).find(id => (PROJ_DEFS as any)[id] === newWeapon);
      const spr = wId ? WEAPON_SPRITES[wId] : null;
      if (spr && spr.complete && spr.naturalWidth > 0) {
        const cvs = document.createElement('canvas');
        cvs.width = 36; cvs.height = 36;
        cvs.style.cssText = 'vertical-align:middle;margin:0 6px';
        cvs.getContext('2d')!.drawImage(spr, 0, 0, 36, 36);
        banner.append(txt1, cvs);
      } else {
        txt1.textContent = `🎁 NOUVEAU : ${newWeapon.emoji} `;
        banner.append(txt1);
      }
      const txt2 = document.createElement('span');
      txt2.textContent = `${newWeapon.label} débloqué !`;
      banner.append(txt2);
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
    }
  }

  // 3 upgrade choices
  const choices = pickUpgrades(3);
  const choicesEl = document.getElementById('lu-choices');
  if (!choicesEl) return;
  choicesEl.innerHTML = '';
  choices.forEach(upg => {
    const card = document.createElement('div');
    card.className = 'lu-choice';
    card.style.borderColor = upg.col + '88';
    // Emoji ou sprite d'arme si l'upgrade est lié à une arme
    const weaponSprite = upg.req ? WEAPON_SPRITES[upg.req] : null;
    let iconHtml: string;
    if (weaponSprite && weaponSprite.complete && weaponSprite.naturalWidth > 0) {
      iconHtml = `<canvas class="lu-choice-emoji" data-weapon="${upg.req}" width="64" height="64"></canvas>`;
    } else {
      iconHtml = `<div class="lu-choice-emoji">${upg.emoji}</div>`;
    }
    card.innerHTML = `
      <div class="lu-choice-top" style="background:${upg.col}">${upg.family}</div>
      ${iconHtml}
      <div class="lu-choice-name">${upg.label}</div>
      <div class="lu-choice-desc">${upg.desc}</div>
    `;
    // Dessiner le sprite dans le canvas
    const cvs = card.querySelector<HTMLCanvasElement>('canvas[data-weapon]');
    if (cvs) {
      const wid = cvs.dataset.weapon!;
      const spr = WEAPON_SPRITES[wid];
      const tc = cvs.getContext('2d')!;
      tc.drawImage(spr, 0, 0, 64, 64);
    }
    card.addEventListener('click', () => {
      pickCounts[upg.id] = (pickCounts[upg.id] || 0) + 1;
      upg.apply();
      luOverlay?.classList.remove('show');
      state.levelUpPaused = false;
      updateHUD();
      checkLevelUp();
    });
    choicesEl.appendChild(card);
  });

  // Confetti
  const conf = document.getElementById('lu-confetti');
  if (conf) {
    conf.innerHTML = '';
    const cols = ['#ff3ea5', '#ffce3a', '#26c6f7', '#7b3ff2', '#ff8a48', '#5fcc52'];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('div');
      p.className = 'lu-conf-piece';
      p.style.cssText = `left:${Math.random()*100}%;top:0;background:${cols[i%cols.length]};animation-duration:${1.8+Math.random()*1.8}s;animation-delay:${Math.random()*.6}s;transform:rotate(${Math.random()*360}deg)`;
      conf.appendChild(p);
    }
  }

  state.levelUpPaused = true;
  luOverlay?.classList.add('show');
}

export function pickUpgrades(n: number): Upgrade[] {
  const available = (UPGRADES as Upgrade[]).filter(u =>
    (pickCounts[u.id] || 0) < (u.max || 99) &&
    (!u.req || unlockedTypes.has(u.req)),
  );
  const shuffled = [...available].sort(() => Math.random() - .5);
  // Ensure family diversity when possible
  const picks: Upgrade[] = [];
  const usedFamilies = new Set<string>();
  for (const u of shuffled) {
    if (picks.length >= n) break;
    if (!usedFamilies.has(u.family) || picks.length === n - 1) {
      picks.push(u);
      usedFamilies.add(u.family);
    }
  }
  while (picks.length < n && picks.length < available.length) {
    const extra = shuffled.find(u => !picks.includes(u));
    if (!extra) break;
    picks.push(extra);
  }
  return picks;
}
