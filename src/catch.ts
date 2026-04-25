// @ts-nocheck
import { state, cats, projectiles, effects, particles, popups, hairballs, caughtTypes, upgradeFlags, pickCounts, pendingLevelUps } from './state';
import { CAT_TYPES } from './data';
import { spawnParticles, spawnPopup, applyTrapEffect } from './effects';

// ── Catch cat ─────────────────────────────────────────────────────────────────
export function comboMult() {
  return state.combo >= 9 ? 4 : state.combo >= 6 ? 3 : state.combo >= 3 ? 2 : 1;
}

export function catchCat(cat, px, py, silent) {
  if (cat.caught) return;
  cat.caught = true;
  if (cat.isObject) {
    if (cat.type.isTrap) {
      applyTrapEffect(cat, px, py);
    } else if (cat.type.pts > 0) {
      state.score += cat.type.pts;
      spawnPopup(px||cat.x, (py||cat.y)-20, `+${cat.type.pts} 🐭`, '#C8A8E8');
      spawnParticles(cat.x, cat.y, 5, false);
      if (state.score > state.hiScore) { state.hiScore=state.score; localStorage.setItem('pdc_hi',state.hiScore); if (hiValEl) hiValEl.textContent=state.hiScore; }
    } else {
      spawnPopup(px||cat.x, (py||cat.y)-20, '🪶 ~', '#C8A8E8');
    }
    updateHUD();
    return;
  }
  const pts = cat.type.pts;
  if (pts > 0) {
    const baseMult = comboMult();
    const luckyMult = cat.lucky ? (upgradeFlags.luckyMult||5) : 1;
    const mult = baseMult * luckyMult;
    const earned = pts * mult;
    state.score += earned + (upgradeFlags.bonusPts||0);
    state.combo++;
    state.comboTimer = 3 + (upgradeFlags.comboBonusTime||0);
    if (cat.type.heals) gainLife();
    if (upgradeFlags.regen) { state.catsForRegen++; if (state.catsForRegen>=12){ state.catsForRegen=0; gainLife(); } }
    spawnParticles(cat.x, cat.y, cat.lucky ? 35 : pts>=5 ? 20 : pts>=3 ? 12 : 7, false);
    if (cat.lucky) {
      spawnPopup(px||cat.x, (py||cat.y)-20, `⭐ LUCKY ×${upgradeFlags.luckyMult||5} !`, '#ffce3a');
      for (let i=0;i<40;i++) {
        const a=Math.random()*Math.PI*2, spd=4+Math.random()*9;
        particles.push({x:cat.x,y:cat.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-4,
          col:['#ffce3a','#ff3ea5','#26c6f7','#7b3ff2'][i%4],
          sz:5+Math.random()*8,life:1,decay:.01,rot:0,rotSpd:(Math.random()-.5)*.4});
      }
    } else if (!silent) {
      const col = pts>=5 ? '#ffce3a' : pts>=3 ? '#7b3ff2' : '#ff3ea5';
      const txt = mult > 1 ? `+${earned} ×${mult}` : `+${earned}`;
      spawnPopup(px||cat.x, py||cat.y, txt, col);
    }
  } else {
    state.score = Math.max(0, state.score + pts);
    state.combo = 0; state.comboTimer = 0;
    spawnParticles(cat.x, cat.y, 8, true);
    if (!silent) spawnPopup(px||cat.x, py||cat.y, String(pts), '#FF4444');
  }
  markCaught(cat.type.id);
  Music.sfxCatch(pts);
  if (state.score > state.hiScore) { state.hiScore=state.score; localStorage.setItem('pdc_hi',state.hiScore); if (hiValEl) hiValEl.textContent=state.hiScore; }
  checkUnlocks();
  checkLevelUp();
  updateHUD();
}

export function updateHUD() {
  scoreEl.textContent = state.score;
  livesEl.textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(Math.max(0, state.MAX_LIVES - state.lives));
  if (state.combo >= 3) {
    const mult = comboMult();
    comboEl.textContent = `${state.combo} COMBO ×${mult}`;
    comboEl.classList.add('active');
  } else if (state.combo > 0) {
    comboEl.textContent = `${state.combo} ↗`;
    comboEl.classList.remove('active');
  } else {
    comboEl.textContent = '';
    comboEl.classList.remove('active');
  }
  const isMax = state.level >= LEVELS.length;
  levelBadge.textContent = isMax ? '★ MAX' : `★ Niv. ${state.level}`;
}

export function drawBossBar() {
  const boss = cats.find(c => c.type.id === 'boss' && !c.caught);
  if (!boss) return;
  const pct = boss.hp / boss.maxHp;
  const bw = Math.min(state.W * 0.72, 340), bh = 18, bx = (state.W - bw) / 2, by = HUD_H + 10;
  ctx.save();
  // Track
  ctx.fillStyle = 'rgba(20,10,40,0.7)';
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 9); ctx.fill();
  // Fill rouge → orange
  const g = ctx.createLinearGradient(bx, 0, bx + bw * pct, 0);
  g.addColorStop(0, '#C0392B'); g.addColorStop(1, '#E74C3C');
  ctx.fillStyle = g;
  ctx.shadowColor = '#C0392B'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.roundRect(bx, by, bw * pct, bh, 9); ctx.fill();
  ctx.shadowBlur = 0;
  // Sheen
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.roundRect(bx, by, bw * pct, bh * 0.42, 9); ctx.fill();
  // Bordure
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 9); ctx.stroke();
  // Label
  ctx.font = `700 11px "Fredoka",Arial`; ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 3;
  ctx.fillText(`👑 BOSS  ${boss.hp} / ${boss.maxHp}`, state.W/2, by + bh/2);
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawXPBar() {
  const isMax = state.level >= LEVELS.length;
  const prev = LEVELS[state.level - 1].threshold;
  const next = isMax ? prev : LEVELS[state.level].threshold;
  const pct  = isMax ? 1 : Math.min(1, (state.score - prev) / (next - prev));
  const barH = 6, barY = HUD_H - barH;
  // Track
  ctx.fillStyle = 'rgba(42,27,74,0.35)';
  ctx.fillRect(0, barY, state.W, barH);
  // Fill — magenta → violet
  if (pct > 0) {
    const g = ctx.createLinearGradient(0,0,state.W,0);
    g.addColorStop(0,'#ff3ea5'); g.addColorStop(1,'#7b3ff2');
    ctx.fillStyle = g;
    ctx.fillRect(0, barY, state.W * pct, barH);
    // Sheen
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, barY, state.W * pct, barH * 0.45);
  }
  // Gold dot at progress tip
  if (pct > 0.02 && pct < 0.99) {
    ctx.fillStyle = '#ffce3a';
    ctx.beginPath(); ctx.arc(state.W * pct, barY + barH/2, barH*0.7, 0, Math.PI*2); ctx.fill();
  }
}

