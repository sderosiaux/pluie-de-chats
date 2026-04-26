import { toast } from './dom';
import { state, unlockedTypes } from './state';
import { PROJ_DEFS } from './data';
import { queueWeaponReveal } from './weapon-reveal';

export function checkUnlocks(): void {
  for (const [id, def] of Object.entries(PROJ_DEFS) as Array<[string, any]>) {
    if (!unlockedTypes.has(id) && state.score >= def.unlockScore) {
      unlockedTypes.add(id);
      queueWeaponReveal(id);
    }
  }
}

export function showToast(msg: string): void {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}
