// Jetons visuels du client. Les couleurs de collier (§8, §17) codent les caractères et ne servent
// à rien d'autre : le reste de l'interface n'emprunte aucune de ces teintes.

import type { CharacterId } from '../sim';

export const THEME = {
  skyHigh: '#cfdce8', // ciel au-dessus du monde (letterbox)
  skyTop: '#dce6ee',
  skyBottom: '#f4eff3',
  worldEdge: 'rgba(255,255,255,0.9)',
  cloud: 'rgba(255,255,255,0.6)',
  ink: '#3b2f4a',
  inkSoft: 'rgba(59,47,74,0.55)',
  inkFaint: 'rgba(59,47,74,0.25)',
  paper: '#fffdfb',
  action: '#6b4fa0',
  progress: '#7ccba2',
  progressTrack: 'rgba(59,47,74,0.12)',
  aim: 'rgba(59,47,74,0.7)',
  aimCancel: 'rgba(59,47,74,0.22)',
  // Encre sombre, pas rouge : le rouge est la couleur du collier du gros (§17, un code couleur = un sens).
  danger: '#2b1a3f',
  blink: '#e0303c',
  neutralTrail: 'rgba(59,47,74,0.2)',
  aimShield: 'rgba(59,47,74,0.7)',
  spark: '#fff6c8',
  particles: ['#ff9fb8', '#ffd166', '#7fd8a8', '#8fb8ff', '#c39bff'],
  launcher: '#c9a27c',
  launcherRim: '#8a6545',
  fontDisplay: "'Baloo 2', 'Arial Rounded MT Bold', system-ui, sans-serif",
  fontText: "'Fredoka', 'Arial Rounded MT Bold', system-ui, sans-serif",
} as const;

export interface CollarLook {
  color: string | 'rainbow';
  icon: string; // '' = pas d'icône ; 'dot' = pastille dessinée (gros)
}

/** null = pas de collier (tigré). Le chien porte un collier marron à médaille os : §30.8 prime sur §8. */
export const COLLARS: Readonly<Record<CharacterId, CollarLook | null>> = {
  tigre: null,
  gros: { color: '#e53935', icon: 'dot' },
  chaton: { color: '#f5c518', icon: '🍼' },
  chien: { color: '#8d5524', icon: '🦴' },
  trouillard: { color: '#2f7de1', icon: '❗' },
  bouclier: { color: '#8a9bb0', icon: '🛡' },
  fusee: { color: '#ff8a1f', icon: '🚀' },
  elastique: { color: 'rainbow', icon: '〰' },
  fantome: { color: 'rgba(170,200,255,0.9)', icon: '👻' },
  maman: { color: '#ff6fb1', icon: '💗' },
};

/** Icône du bandeau de première apparition (§13). */
export const BANNER_ICON: Readonly<Record<CharacterId, string>> = {
  tigre: '🐱', gros: '🔴', chaton: '🍼', chien: '🐶', trouillard: '❗',
  bouclier: '🛡', fusee: '🚀', elastique: '〰', fantome: '👻', maman: '💗',
};

export const RAINBOW = ['#ff4d4d', '#ff9f1c', '#ffd93d', '#4cd97b', '#3fa7ff', '#9b6bff'];
