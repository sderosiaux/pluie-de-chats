// Types partagés du jeu

export interface Pos { x: number; y: number; }

export interface CatType {
  id: string;
  pts: number;
  col: string;
  size: number;
  w: number;
  stripes?: boolean;
  minLvl?: number;
  hp?: number;
  label?: string;
  hint?: string;
  heals?: boolean;
  isObject?: boolean;
  isNeutral?: boolean;
  isTrap?: boolean;
  trapKind?: 'bomb' | 'dog' | 'puddle' | 'chili' | 'vacuum';
  baseVy?: number;
}

export interface Cat {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  type: CatType;
  rot: number;
  wobble: number;
  wobbleSpd: number;
  caught: boolean;
  catchAnim: number;
  hp: number;
  maxHp: number;
  shieldFlash: number;
  bossState: 'entering' | 'idle' | null;
  bossAttackTimer: number;
  bossAttackKind: number;
  bossAnchorX: number;
  bossWobble: number;
  visible: boolean;
  visTimer: number;
  spitTimer: number;
  lucky: boolean;
  spriteFlip: boolean;
  spriteRot: number;
  poseIdx: number;
  spriteScale: number;
  speech: { text: string; age: number; dur: number } | null;
  isObject?: boolean;
}

export interface ProjDef {
  label: string;
  emoji: string;
  col: string;
  speed: [number, number];
  gravity: number;
  stock: number;
  maxStock: number;
  recharge: number;
  unlockScore: number;
  unlockHint: string | null;
  unlockMsg: string | null;
  bounces?: number;
  fuseTime?: number;
  blastR?: number;
  pullR?: number;
  pullDur?: number;
  desc: string;
}

export interface Projectile {
  x: number; y: number;
  vx: number; vy: number;
  type: string;
  r: number;
  gravity: number;
  bounces: number;
  fuseTimer: number;
  fuseAngle: number;
  fuseDistance: number;
  distTraveled: number;
  rot: number;
  rotSpd: number;
  trail: Pos[];
  trailTimer: number;
  active: boolean;
  // Charge mechanic (set au tir, lu par explode/deployCarton)
  chargeBlastFactor?: number;    // multiplie blastR pour artifice
  chargeCartonFactor?: number;   // multiplie pullR pour carton
  chargeCartonDurBonus?: number; // ajoute des secondes à pullDur pour carton
}

export interface Effect {
  type: string;
  x?: number; y?: number;
  x1?: number; y1?: number;
  x2?: number; y2?: number;
  life: number;
  dur: number;
  age: number;
  r?: number;
  maxR?: number;
  caught?: number;
  caughtIds?: Set<number>;
  level?: number;
  desc?: string;
  shownMissMsg?: boolean;
  shownMultiMsg?: boolean;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  col: string;
  sz: number;
  life: number;
  decay: number;
  rot: number;
  rotSpd: number;
}

export interface Popup {
  x: number; y: number;
  text: string;
  col: string;
  life: number;
  vy: number;
}

export interface Hairball {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  age: number;
  dur: number;
  catId: number;
}

export interface Cloud {
  x: number; y: number;
  r: number;
  spd: number;
  a: number;
}

export interface Floater {
  x: number; y: number;
  sz: number;
  vy: number;
  drift: number;
  rot: number;
  rotSpd: number;
  alpha: number;
  col: string;
  shape: 'star' | 'sparkle' | 'heart';
}

export interface ObjectType extends CatType {
  isObject: true;
  baseVy: number;
}

export interface Upgrade {
  id: string;
  family: string;
  emoji: string;
  col: string;
  req?: string;
  label: string;
  desc: string;
  max?: number;
  apply: () => void;
}

export interface ActiveEvent {
  id: string;
  timer: number;
}

export interface EventBanner {
  text: string;
  desc?: string;
  col: string;
  age: number;
  dur: number;
}

export interface StaticMsg {
  x: number; y: number;
  text: string;
  col: string;
  age: number;
  dur: number;
  sprite?: HTMLImageElement;
}

export type SceneId = 'city' | 'garden' | 'home' | 'forest';
