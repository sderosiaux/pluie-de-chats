import type { CharacterId } from './types';

export interface CharacterDef {
  id: CharacterId;
  label: string;
  rule: string; // ≤ 4 mots, affiché à la première apparition (§13)
  mass: number;
  transfer: number;
  lifeTicks: number; // durée de vie en boulet
  fallSpeed: number; // px/s
  scale: number; // rayon relatif
  catchable: boolean; // compte dans les pattes
}

// Valeurs de GAME_SPEC §8 (durées converties en ticks à 120 Hz). Vitesses de chute à ±20 % du tigré (§13).
export const CHARACTERS: Readonly<Record<CharacterId, CharacterDef>> = {
  tigre: { id: 'tigre', label: 'Tigré', rule: '', mass: 1, transfer: 0.8, lifeTicks: 144, fallSpeed: 70, scale: 1, catchable: true },
  gros: { id: 'gros', label: 'Gros', rule: 'traverse tout', mass: 3, transfer: 1, lifeTicks: 240, fallSpeed: 56, scale: 1.35, catchable: true },
  chaton: { id: 'chaton', label: 'Chaton', rule: "s'éteint vite", mass: 0.5, transfer: 0.5, lifeTicks: 84, fallSpeed: 80, scale: 0.7, catchable: true },
  chien: { id: 'chien', label: 'Chien déguisé', rule: 'ne pas toucher', mass: 1, transfer: 0, lifeTicks: 0, fallSpeed: 70, scale: 1, catchable: false },
  trouillard: { id: 'trouillard', label: 'Trouillard', rule: 'esquive la pelote', mass: 1, transfer: 0.8, lifeTicks: 144, fallSpeed: 72, scale: 1, catchable: true },
  bouclier: { id: 'bouclier', label: 'Bouclier', rule: 'deux coups', mass: 2, transfer: 0.8, lifeTicks: 144, fallSpeed: 66, scale: 1.05, catchable: true },
  fusee: { id: 'fusee', label: 'Fusée', rule: 'file tout droit', mass: 1, transfer: 1, lifeTicks: 108, fallSpeed: 70, scale: 1, catchable: true },
  elastique: { id: 'elastique', label: 'Élastique', rule: 'accélère aux murs', mass: 1, transfer: 0.8, lifeTicks: 300, fallSpeed: 70, scale: 1, catchable: true },
  fantome: { id: 'fantome', label: 'Fantôme', rule: 'pelote seulement', mass: 1, transfer: 0.8, lifeTicks: 72, fallSpeed: 64, scale: 1, catchable: true },
  maman: { id: 'maman', label: 'Maman', rule: 'emporte ses chatons', mass: 1.5, transfer: 0.8, lifeTicks: 144, fallSpeed: 62, scale: 1.15, catchable: true },
};

export const ELASTIC_RESTITUTION = 1.15;
