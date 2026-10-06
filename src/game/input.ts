// Visée « vers le doigt » (§6) : appui / glisser → visée, relâcher → tir. Un seul pointeur à la fois.
// Convertit l'écran en monde ; c'est main.ts qui décide quoi faire de l'angle.

import { screenToWorld } from './view';
import type { View } from './view';

export interface AimHandlers {
  onGesture(): void; // premier contact utilisateur (déblocage audio)
  onAim(wx: number, wy: number): void;
  onRelease(wx: number, wy: number): void;
  onCancel(): void;
}

export function attachInput(canvas: HTMLCanvasElement, getView: () => View, h: AimHandlers): void {
  let active: number | null = null;

  const toWorld = (e: PointerEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    return screenToWorld(getView(), e.clientX - rect.left, e.clientY - rect.top);
  };

  canvas.addEventListener('pointerdown', e => {
    h.onGesture();
    if (active !== null || !e.isPrimary) return;
    active = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    const p = toWorld(e);
    h.onAim(p.x, p.y);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== active) return;
    const p = toWorld(e);
    h.onAim(p.x, p.y);
  });
  canvas.addEventListener('pointerup', e => {
    if (e.pointerId !== active) return;
    active = null;
    const p = toWorld(e);
    h.onRelease(p.x, p.y);
  });
  const cancel = (e: PointerEvent): void => {
    if (e.pointerId !== active) return;
    active = null;
    h.onCancel();
  };
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('lostpointercapture', cancel);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}
