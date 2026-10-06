// Conversion écran ↔ monde logique (360 × 640, letterbox). Fonctions pures, sans DOM.
//
// L'échelle et les décalages sont arrondis vers le bas au 1/256 de pixel CSS : avec des valeurs
// dyadiques, monde → écran → monde est exact au bit près (produit et somme exacts, puis division
// exacte). Le décalage visuel est < 0,4 % : invisible.

import { ANGLE_MAX, ANGLE_MIN, LAUNCH_X, LAUNCH_Y, WORLD_H, WORLD_W } from '../sim';

export interface View {
  readonly width: number; // taille CSS de la zone d'affichage
  readonly height: number;
  readonly scale: number; // pixels CSS par unité monde
  readonly offX: number; // position CSS du coin (0, 0) du monde
  readonly offY: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

const GRID = 256;
const snap = (v: number): number => Math.floor(v * GRID) / GRID;

export function fitView(width: number, height: number): View {
  if (!(width > 0 && height > 0)) throw new Error(`fitView: taille d'écran invalide ${width}×${height}`);
  const scale = Math.max(1 / GRID, snap(Math.min(width / WORLD_W, height / WORLD_H)));
  return {
    width,
    height,
    scale,
    offX: snap((width - WORLD_W * scale) / 2),
    offY: snap((height - WORLD_H * scale) / 2),
  };
}

export function worldToScreen(v: View, x: number, y: number): Point {
  return { x: x * v.scale + v.offX, y: y * v.scale + v.offY };
}

export function screenToWorld(v: View, x: number, y: number): Point {
  return { x: (x - v.offX) / v.scale, y: (y - v.offY) / v.scale };
}

/**
 * Angle de tir « vers le doigt » (§6) depuis le lanceur, en dixièmes de degré entiers
 * (0 = droite, 900 = haut). null = sous 7° au-dessus de l'horizontale : tir annulé.
 */
export function aimAngleDeci(wx: number, wy: number): number | null {
  const deg = (Math.atan2(LAUNCH_Y - wy, wx - LAUNCH_X) * 180) / Math.PI;
  const a = Math.round(deg * 10);
  return a >= ANGLE_MIN && a <= ANGLE_MAX ? a : null;
}
