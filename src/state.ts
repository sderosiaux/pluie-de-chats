// État global mutable. Tous les modules importent et mutent ce singleton.
export const state: any = {
  // Score / progression
  score: 0, combo: 0, comboTimer: 0, gameTime: 0, spawnTimer: 0, objectSpawnTimer: 10,
  level: 1, laserHitWidth: 6,
  lives: 5, hiScore: parseInt(localStorage.getItem('pdc_hi') || '0', 10) || 0,
  MAX_LIVES: 7,
  catsForRegen: 0,
  gameOver: false, levelUpPaused: false, menuActive: true,
  // Input / aim
  isDragging: false, dragPos: null as any,
  pointerDown: false,
  selectedType: 'pelote',
  activeSteerLaser: null as any,
  runId: 0,
  // Layout (set by canvas.resize)
  W: 0, H: 0, LAUNCHER: { x: 0, y: 0 },
  DECOR_H: 150, INV_H: 280, DIAL_CY: 0,
  // Time
  timeScale: 1, slowMoTimer: 0,
  // Trap effects
  wetTimer: 0, spicyTimer: 0,
  // Events
  activeEvent: null as any,
  eventBanner: null as any,
  eventNextIn: 35 + Math.random() * 20,
  // Misc
  _catIdCounter: 0, _cheatBuf: '',
  currentScene: 'city',
  staticMsg: null,
};

// Collections — mutées par push/splice. Const car la référence ne change pas.
export const cats: any[] = [];
export const projectiles: any[] = [];
export const effects: any[] = [];
export const particles: any[] = [];
export const popups: any[] = [];
export const hairballs: any[] = [];
export const clouds: any[] = [];
export const bgFloaters: any[] = [];
export const unlockedTypes = new Set<string>(['pelote']);
export const caughtTypes = new Set<string>();
export const rechargeTimers: Record<string, number> = {};
export const upgradeFlags: any = {};
export const pickCounts: Record<string, number> = {};
export const pendingLevelUps: any[] = [];

// DOM elements (set by main during init)
export const dom: any = {};
export const stateExt: any = { staticMsg: null };
