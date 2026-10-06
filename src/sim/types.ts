export type CharacterId =
  | 'tigre' | 'gros' | 'chaton' | 'chien' | 'trouillard'
  | 'bouclier' | 'fusee' | 'elastique' | 'fantome' | 'maman';

/** Un chat prévu dans l'averse. Tout est fixé à la génération : la sim ne tire aucun aléa. */
export interface SpawnDef {
  tick: number;
  char: CharacterId;
  costume: string;
  x: number; // ancre horizontale au moment de l'apparition
  swayAmp: number; // amplitude d'oscillation (px)
  swayPhase: number; // phase d'oscillation (tours)
  /** Escorte d'une maman : index (dans `spawns`) de la maman suivie, et décalage relatif. */
  escortOf?: number;
  escortDx?: number;
  escortDy?: number;
}

export interface AverseDef {
  id: string;
  chapter: number;
  pelotes: number;
  spawns: readonly SpawnDef[]; // triés par tick croissant
}

export type CatState = 'fall' | 'boulet' | 'gone';

export interface Cat {
  id: number;
  spawnIdx: number;
  char: CharacterId;
  costume: string;
  r: number;
  st: CatState;
  x: number;
  y: number;
  anchorX: number;
  vx: number;
  vy: number;
  age: number; // ticks depuis l'apparition
  swayAmp: number;
  swayPhase: number;
  leapVx: number;
  leapCd: number; // ticks avant de pouvoir esquiver à nouveau
  shield: boolean;
  life: number; // ticks restants en boulet
  chainId: number; // -1 tant que pas attrapé
  escortOf: number; // id de la maman suivie, -1 sinon
  escortDx: number;
  escortDy: number;
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number; // rebonds latéraux restants
}

export interface Chain {
  id: number;
  n: number; // chats attrapés (hors chien)
  alive: number; // boulets encore en vol
  done: boolean;
}

export interface InputEntry {
  tick: number;
  angleDeci: number;
}
export type InputLog = InputEntry[];

// `ballId` = id de la pelote responsable, -1 quand c'est un boulet.
export type SimEvent =
  | { type: 'shot'; tick: number; angleDeci: number }
  | { type: 'catch'; catId: number; chainId: number; n: number; x: number; y: number; vx: number; vy: number; by: 'ball' | 'boulet'; ballId: number }
  | { type: 'dog'; catId: number; x: number; y: number; by: 'ball' | 'boulet'; ballId: number }
  | { type: 'shield'; catId: number; x: number; y: number; ballId: number }
  | { type: 'dodge'; catId: number }
  | { type: 'bounce'; catId: number; x: number; y: number }
  | { type: 'chainEnd'; chainId: number; n: number; points: number; refund: boolean }
  | { type: 'miss'; catId: number; x: number }
  | { type: 'ballLost'; ballId: number }
  | { type: 'end' };

export interface SimState {
  averse: AverseDef;
  tick: number;
  nextSpawn: number;
  nextId: number;
  spawnToCat: number[]; // index de spawn → id du chat (-1 si pas encore apparu)
  cats: Cat[]; // triés par id
  balls: Ball[]; // triés par id
  chains: Chain[];
  pelotes: number;
  cooldown: number; // ticks
  score: number; // entier
  caught: number;
  missed: number;
  dogsHit: number;
  bestChain: number;
  ended: boolean;
  log: InputLog;
  events: SimEvent[];
}

export type ShotResult = 'ok' | 'cooldown' | 'empty' | 'angle' | 'ended';

export interface Prediction {
  kind: 'catch' | 'dog' | 'shield' | 'none';
  /** Trajet de la pelote jusqu'au contact (ou sortie), échantillonné. */
  path: Array<{ x: number; y: number }>;
  x: number;
  y: number;
  catId: number;
  /** Direction de départ du chat touché (kind = 'catch'). */
  dirX: number;
  dirY: number;
  /** Trouillards qui vont esquiver la pelote pendant ce tir. */
  dodges: number[];
}
