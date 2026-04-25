// Canvas, ctx, et logique de resize. Met à jour state.W / state.H / state.LAUNCHER / state.DIAL_CY.
import { state } from './state';
import { SLOT_R, LAUNCHER_GAP } from './config';

export const canvas = document.getElementById('game') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d')!;

function getSafeBottom() {
  return parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--sab') || '0', 10) || 0;
}

export function resize() {
  state.W = canvas.width = window.innerWidth;
  state.H = canvas.height = window.innerHeight;
  state.DECOR_H = Math.max(100, Math.min(140, Math.round(state.H * 0.15))) + getSafeBottom();
  // Une seule rangée horizontale de slots → bien plus compact verticalement.
  state.DIAL_CY = state.H - SLOT_R - 28 - getSafeBottom();
  state.LAUNCHER = { x: state.W / 2, y: state.DIAL_CY - SLOT_R - LAUNCHER_GAP };
  state.INV_H = (state.H - (state.LAUNCHER.y - 30));
}
resize();
window.addEventListener('resize', resize);
