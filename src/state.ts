// État global mutable. Tous les modules importent et mutent ce singleton.
import type {
  Cat, Projectile, Effect, Particle, Popup, Hairball, Cloud, Floater,
  ActiveEvent, EventBanner, StaticMsg, SceneId, Pos
} from './types';

export interface GameState {
  // Score / progression
  score: number;
  combo: number;
  comboTimer: number;
  gameTime: number;
  spawnTimer: number;
  objectSpawnTimer: number;
  level: number;
  laserHitWidth: number;
  lives: number;
  hiScore: number;
  MAX_LIVES: number;
  catsForRegen: number;
  gameOver: boolean;
  levelUpPaused: boolean;
  menuActive: boolean;
  hudMenuOpen: boolean;
  // Input / aim
  isDragging: boolean;
  dragPos: Pos | null;
  pointerDown: boolean;
  selectedType: string;
  activeSteerLaser: Effect | null;
  runId: number;
  // Layout (set by canvas.resize)
  W: number;
  H: number;
  LAUNCHER: Pos;
  DECOR_H: number;
  INV_H: number;
  DIAL_CY: number;
  // Time
  timeScale: number;
  slowMoTimer: number;
  // Trap effects
  wetTimer: number;
  spicyTimer: number;
  // Charge mechanic — temps écoulé depuis le début du drag (en secondes)
  chargeStart: number; // gameTime au début du drag courant, ou 0 si pas en charge
  chargeRatio: number; // 0..1+, calculé par game loop pour feedback visuel
  // Events
  activeEvent: ActiveEvent | null;
  eventBanner: EventBanner | null;
  eventNextIn: number;
  // Misc
  _catIdCounter: number;
  _cheatBuf: string;
  currentScene: SceneId;
  staticMsg: StaticMsg | null;
}

export const state: GameState = {
  score: 0,
  combo: 0,
  comboTimer: 0,
  gameTime: 0,
  spawnTimer: 0,
  objectSpawnTimer: 10,
  level: 1,
  laserHitWidth: 6,
  lives: 3,
  hiScore: parseInt(localStorage.getItem('pdc_hi') || '0', 10) || 0,
  MAX_LIVES: 3,
  catsForRegen: 0,
  gameOver: false,
  levelUpPaused: false,
  menuActive: true,
  hudMenuOpen: false,
  isDragging: false,
  dragPos: null,
  pointerDown: false,
  selectedType: 'pelote',
  activeSteerLaser: null,
  runId: 0,
  W: 0,
  H: 0,
  LAUNCHER: { x: 0, y: 0 },
  DECOR_H: 150,
  INV_H: 280,
  DIAL_CY: 0,
  timeScale: 1,
  slowMoTimer: 0,
  wetTimer: 0,
  spicyTimer: 0,
  chargeStart: 0,
  chargeRatio: 0,
  activeEvent: null,
  eventBanner: null,
  eventNextIn: 35 + Math.random() * 20,
  _catIdCounter: 0,
  _cheatBuf: '',
  currentScene: 'city',
  staticMsg: null,
};

// Collections — mutées par push/splice. Const car la référence ne change pas.
export const cats: Cat[] = [];
export const projectiles: Projectile[] = [];
export const effects: Effect[] = [];
export const particles: Particle[] = [];
export const popups: Popup[] = [];
export const hairballs: Hairball[] = [];
export const clouds: Cloud[] = [];
export const bgFloaters: Floater[] = [];
export const unlockedTypes = new Set<string>(['pelote']);
export const caughtTypes = new Set<string>();
export const rechargeTimers: Record<string, number> = {};
export const upgradeFlags: Record<string, any> = {};
export const pickCounts: Record<string, number> = {};
export const pendingLevelUps: Array<{ lvl: number; def: any; newWeapon?: string }> = [];
