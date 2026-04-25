// @ts-nocheck
import { spawnCat } from './spawn';
import { Music } from './audio';
import { state, cats } from './state';
import { EVENT_POOL } from './config';
import { CAT_TYPES } from './data';

// ── Event system ─────────────────────────────────────────────────────────────


export function triggerEvent() {
  const pool = EVENT_POOL.filter(e => e.id !== 'boss' || state.level >= 6);
  const ev = pool[Math.floor(Math.random()*pool.length)];
  state.activeEvent = { id: ev.id, timer: ev.dur };
  state.eventBanner = { text: ev.name, desc: ev.desc, col: ev.col, age: 0, dur: 3.2 };
  state.eventNextIn = 40 + Math.random()*25;

  if (ev.id === 'pluie') {
    const thisRun = state.runId;
    for (let i=0;i<16;i++) setTimeout(()=>{ if(state.runId===thisRun&&!state.gameOver) spawnCat(); }, i*160);
  }
  if (ev.id === 'boss') {
    const bossType = CAT_TYPES.find(t=>t.id==='boss');
    const thisRun = state.runId;
    setTimeout(()=>{ if(state.runId===thisRun&&!state.gameOver&&bossType) spawnCat(bossType); }, 1800);
    Music.sfxLevelUp(); // fanfare d'annonce
  }
}

