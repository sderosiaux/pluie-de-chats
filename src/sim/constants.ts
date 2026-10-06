// Monde logique fixe : le rendu met à l'échelle, la sim ne connaît jamais l'écran.
export const WORLD_W = 360;
export const WORLD_H = 640;
export const LAUNCH_X = 180;
export const LAUNCH_Y = 610;

export const TICK_HZ = 120;
export const DT = 1 / TICK_HZ;

export const ANGLE_MIN = 70; // 7° au-dessus de l'horizontale (§6)
export const ANGLE_MAX = 1730;

export const BALL_SPEED = 900;
export const BALL_G = 300;
export const BALL_R = 10;
export const BALL_MAX_BOUNCES = 2;
export const COOLDOWN_TICKS = 60; // 0,5 s

export const CAT_BASE_R = 18;
export const SWAY_PERIOD_TICKS = 288; // 2,4 s

export const BOULET_G = 900;
export const RESTITUTION = 0.8;
export const MIN_BOULET_SPEED = 380;
export const MAX_BOULET_SPEED = 1600;
export const ESCORT_PULL_SPEED = 450;

export const DODGE_RADIUS = 85;
export const LEAP_SPEED = 520;
export const LEAP_DAMP = 0.94; // par tick
export const LEAP_COOLDOWN_TICKS = 132;

export const DOG_PENALTY = 5;
export const REFUND_MIN_CHAIN = 4;
export const PELOTE_BONUS = 3;
export const STAR_THRESHOLDS = [0.5, 0.75, 0.9] as const;
