// Constantes globales du jeu
import type { SceneId } from './types';

export const HUD_H = 56;
export const DIAL_R = 62;
export const DIAL_HUB_R = 32;
export const DIAL_ANGLES: number[] = [-90, 0, 90, 180];
export const GRAVITY = 0.26;
export const MAX_PULL = 140;
export const MIN_SPEED = 6;
export const MAX_SPEED = 22;
export const CAT_SPAWN_Y = HUD_H - 10;

export const TYPE_ORDER: string[] = ['pelote', 'artifice', 'laser', 'carton'];

export interface Level {
  threshold: number;
  bonus: string | null;
  desc: string | null;
}

export const LEVELS: Level[] = [
  { threshold:   0, bonus: null,             desc: null },
  { threshold:  20, bonus: 'bounce',         desc: '🧶 Pelote : +1 rebond' },
  { threshold:  50, bonus: 'blast',          desc: '🎆 Explosion +30px plus large' },
  { threshold:  90, bonus: 'recharge',       desc: '⚡ Recharge 25% plus rapide' },
  { threshold: 150, bonus: 'pelote_stock',   desc: '🧶 +1 Pelote en réserve' },
  { threshold: 220, bonus: 'laser_width',    desc: '🔴 Laser frappe 2× plus large' },
  { threshold: 320, bonus: 'carton_pull',    desc: '📦 Carton encore plus puissant !' },
  { threshold: 450, bonus: 'carton_radius',  desc: '📦 Carton aspire +60px de plus' },
  { threshold: 620, bonus: 'artifice_stock', desc: "🎆 +1 Feu d'artifice en réserve" },
  { threshold: 840, bonus: 'mega_recharge',  desc: '⭐ Recharge ultra-rapide !' },
];

export const CONFETTI: string[] = ['#ff3ea5', '#ffce3a', '#26c6f7', '#7b3ff2', '#ff8a48', '#5fcc52', '#fff8e6'];
export const SCENES: SceneId[] = ['city', 'garden', 'home', 'forest'];
export const FLOATER_COLS: string[] = ['#ffd6f2', '#fff7c0', '#ffffff', '#e8d5ff', '#ffe1c0', '#c8eaff'];
export const HEART_COLS: string[] = ['#ff8aba', '#ffb3d9', '#ff6b9e', '#ffa3c4'];
export const FLOATER_SHAPES: Array<'star' | 'sparkle' | 'heart'> = ['star', 'star', 'sparkle', 'heart'];

export interface GameEvent {
  id: 'pluie' | 'turbo' | 'rares' | 'nuit' | 'boss';
  name: string;
  desc: string;
  col: string;
  dur: number;
}

export const EVENT_POOL: GameEvent[] = [
  { id: 'pluie', name: '🌊 PLUIE DE CHATS !', desc: "16 chats débarquent d'un coup !",      col: '#2980B9', dur: 8  },
  { id: 'turbo', name: '⚡ MODE TURBO !',       desc: 'Chats 2× plus rapides — bonne chance', col: '#E67E22', dur: 10 },
  { id: 'rares', name: '🌈 VAGUE DORÉE !',      desc: 'Que des chats rares, +points !',       col: '#8E44AD', dur: 12 },
  { id: 'nuit',  name: '🌙 NUIT DES CHATS...',  desc: 'Visibilité réduite — cherche les yeux', col: '#2C3E50', dur: 14 },
  { id: 'boss',  name: '👑 LE BOSS ARRIVE !',   desc: 'Gros chat, gros points... gros danger', col: '#C0392B', dur: 28 },
];
