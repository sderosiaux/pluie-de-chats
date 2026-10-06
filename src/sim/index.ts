// API publique de la simulation. Client et Worker n'importent que d'ici.
export { createSim, cloneSim, step, tryShoot, drainEvents, runReplay, stars, finalScore, catchableCount } from './sim';
export type { ReplayResult } from './sim';
export { predictFirstContact } from './predict';
export { hashState } from './hash';
export { createRng } from './rng';
export type { Rng } from './rng';
export { dirFromAngleDeci } from './fmath';
export { CHARACTERS } from './characters';
export type { CharacterDef } from './characters';
export * from './constants';
export type * from './types';
export { HANDMADE, handmadeById } from './averses/handmade';
