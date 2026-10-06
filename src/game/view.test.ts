import { describe, expect, it } from 'vitest';
import { LAUNCH_X, LAUNCH_Y, WORLD_H, WORLD_W } from '../sim';
import { aimAngleDeci, fitView, screenToWorld, worldToScreen } from './view';

const SCREENS: Array<[string, number, number]> = [
  ['iPhone portrait', 390, 844],
  ['petit Android', 360, 640],
  ['desktop paysage', 1440, 900],
  ['très large', 3840, 400],
  ['très étroit', 120, 2000],
  ['tablette', 820, 1180],
  ['taille impaire', 333, 777],
];

// Points monde : grille entière, demi et quart de pixel, bords et lanceur.
const WORLD_POINTS: Array<[number, number]> = [];
for (let x = 0; x <= WORLD_W; x += 15) for (let y = 0; y <= WORLD_H; y += 20) WORLD_POINTS.push([x, y]);
WORLD_POINTS.push([0.5, 0.25], [359.75, 639.5], [LAUNCH_X, LAUNCH_Y], [-12, -30], [372, 655]);

describe('view : letterbox', () => {
  it.each(SCREENS)('%s (%i×%i) : le monde tient entier et centré', (_name, w, h) => {
    const v = fitView(w, h);
    expect(WORLD_W * v.scale).toBeLessThanOrEqual(w);
    expect(WORLD_H * v.scale).toBeLessThanOrEqual(h);
    expect(v.offX).toBeGreaterThanOrEqual(0);
    expect(v.offY).toBeGreaterThanOrEqual(0);
    // Un des deux axes remplit l'écran (à l'arrondi 1/256 près).
    const fill = Math.max((WORLD_W * v.scale) / w, (WORLD_H * v.scale) / h);
    expect(fill).toBeGreaterThan(0.99);
    // Centré à 1/256 px près.
    expect(Math.abs(v.offX - (w - WORLD_W * v.scale - v.offX))).toBeLessThanOrEqual(2 / 256);
    expect(Math.abs(v.offY - (h - WORLD_H * v.scale - v.offY))).toBeLessThanOrEqual(2 / 256);
  });

  it.each(SCREENS)('%s (%i×%i) : monde → écran → monde est exact', (_name, w, h) => {
    const v = fitView(w, h);
    for (const [x, y] of WORLD_POINTS) {
      const s = worldToScreen(v, x, y);
      const back = screenToWorld(v, s.x, s.y);
      expect(back.x).toBe(x);
      expect(back.y).toBe(y);
    }
  });

  it.each(SCREENS)('%s (%i×%i) : écran → monde → écran à 1e-9 px', (_name, w, h) => {
    const v = fitView(w, h);
    for (let i = 0; i <= 20; i++) {
      for (let j = 0; j <= 20; j++) {
        const sx = (w * i) / 20 + 0.37, sy = (h * j) / 20 + 0.61;
        const p = screenToWorld(v, sx, sy);
        const back = worldToScreen(v, p.x, p.y);
        expect(Math.abs(back.x - sx)).toBeLessThan(1e-9);
        expect(Math.abs(back.y - sy)).toBeLessThan(1e-9);
      }
    }
  });

  it('les coins du monde tombent sur les bords de la zone de jeu', () => {
    const v = fitView(390, 844);
    const tl = worldToScreen(v, 0, 0), br = worldToScreen(v, WORLD_W, WORLD_H);
    expect(tl.x).toBe(v.offX);
    expect(tl.y).toBe(v.offY);
    expect(br.x).toBe(v.offX + WORLD_W * v.scale);
    expect(br.y).toBe(v.offY + WORLD_H * v.scale);
  });

  it('refuse une taille nulle', () => {
    expect(() => fitView(0, 100)).toThrow();
    expect(() => fitView(100, Number.NaN)).toThrow();
  });
});

describe('view : angle vers le doigt', () => {
  it('droit au-dessus = 900, à droite à 45° = 450, à gauche à 45° = 1350', () => {
    expect(aimAngleDeci(LAUNCH_X, 100)).toBe(900);
    expect(aimAngleDeci(LAUNCH_X + 100, LAUNCH_Y - 100)).toBe(450);
    expect(aimAngleDeci(LAUNCH_X - 100, LAUNCH_Y - 100)).toBe(1350);
  });

  it('sous 7° au-dessus de l’horizontale (des deux côtés) ou sous le lanceur : annulé', () => {
    expect(aimAngleDeci(LAUNCH_X + 100, LAUNCH_Y)).toBeNull();
    expect(aimAngleDeci(LAUNCH_X - 100, LAUNCH_Y)).toBeNull();
    expect(aimAngleDeci(LAUNCH_X + 100, LAUNCH_Y - 12)).toBeNull(); // ≈ 6,8°
    expect(aimAngleDeci(LAUNCH_X - 100, LAUNCH_Y - 12)).toBeNull();
    expect(aimAngleDeci(LAUNCH_X, LAUNCH_Y + 30)).toBeNull();
  });

  it('borne 7° incluse, quantifiée à l’entier', () => {
    const t = Math.tan((7 * Math.PI) / 180) * 100;
    expect(aimAngleDeci(LAUNCH_X + 100, LAUNCH_Y - t)).toBe(70);
    expect(aimAngleDeci(LAUNCH_X - 100, LAUNCH_Y - t)).toBe(1730);
    const a = aimAngleDeci(250, 300);
    expect(a).not.toBeNull();
    expect(Number.isInteger(a)).toBe(true);
  });
});
