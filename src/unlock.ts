import { toast } from './dom';
import { state, unlockedTypes } from './state';
import { PROJ_DEFS } from './data';

export function checkUnlocks(): void {
  for (const [id, def] of Object.entries(PROJ_DEFS) as Array<[string, any]>) {
    if (!unlockedTypes.has(id) && state.score >= def.unlockScore) {
      unlockedTypes.add(id);
      // Toast avec sprite au lieu d'emoji
      showWeaponUnlockToast(id, def.label);
    }
  }
}

function showWeaponUnlockToast(weaponId: string, label: string): void {
  if (!toast) return;
  toast.innerHTML = `<img src="${import.meta.env.BASE_URL}sprites/weapons/${weaponId}.png" alt="" style="width:28px;height:28px;vertical-align:middle;margin-right:8px"><span>${label} débloqué !</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

export function showToast(msg: string): void {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}
