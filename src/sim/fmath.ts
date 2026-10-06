// Trigonométrie déterministe : uniquement + − × ÷ (correctement arrondis en IEEE 754),
// donc bit-identique entre moteurs JS. Math.sin/cos ne le sont pas (GAME_SPEC §24).

const PI = 3.141592653589793;
const HALF_PI = 1.5707963267948966;
const TAU = 6.283185307179586;

// Taylor jusqu'à x^17 sur [-π/2, π/2] : erreur < 1e-13.
function sinCore(x: number): number {
  const x2 = x * x;
  return x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880
    + x2 * (-1 / 39916800 + x2 * (1 / 6227020800 + x2 * (-1 / 1307674368000 + x2 * (1 / 355687428096000)))))))));
}

/** sin d'un angle exprimé en tours (1 tour = 2π). */
export function fsin(turns: number): number {
  let x = (turns - Math.round(turns)) * TAU; // [-π, π]
  if (x > HALF_PI) x = PI - x;
  else if (x < -HALF_PI) x = -PI - x;
  return sinCore(x);
}

export function fcos(turns: number): number {
  return fsin(turns + 0.25);
}

/**
 * Direction unitaire en coordonnées monde (y vers le bas) d'un angle en dixièmes de degré :
 * 0 = droite, 900 = vers le haut, 1800 = gauche.
 */
export function dirFromAngleDeci(angleDeci: number): { x: number; y: number } {
  const turns = angleDeci / 3600;
  return { x: fcos(turns), y: -fsin(turns) };
}
