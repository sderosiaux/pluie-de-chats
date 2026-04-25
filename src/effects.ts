// @ts-nocheck
import { state, particles, popups, hairballs, cats, effects, rechargeTimers, upgradeFlags } from './state';
import { CONFETTI } from './config';
import { PROJ_DEFS } from './data';
import { ctx } from './canvas';

// ── Particles & popups ────────────────────────────────────────────────────────
export function spawnParticles(x,y,count,fail) {
  for (let i=0;i<count;i++) {
    const a=Math.random()*Math.PI*2, spd=3+Math.random()*7;
    particles.push({
      x,y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd-3.5,
      col: fail?'#FF4444':CONFETTI[Math.floor(Math.random()*CONFETTI.length)],
      sz:4+Math.random()*7, life:1, decay:.018+Math.random()*.018,
      rot:Math.random()*Math.PI*2, rotSpd:(Math.random()-.5)*.3
    });
  }
}
export function spawnPopup(x,y,text,col) {
  popups.push({ x, y, text, col, life:1, vy:-2.8 });
}

export function showStaticMsg(x, y, text, col) {
  state.staticMsg = { x, y, text, col, age: 0, dur: 1.4 };
}

export function loseLife() {
  if (upgradeFlags.shield) { upgradeFlags.shield=false; spawnPopup(state.LAUNCHER.x,state.LAUNCHER.y-60,'🛡️ BLOQUÉ !','#3DC47E'); return; }
  if (state.gameOver || state.lives <= 0) return;
  state.lives--;
  spawnParticles(state.LAUNCHER.x, state.LAUNCHER.y-20, 10, true);
  spawnPopup(state.LAUNCHER.x, state.LAUNCHER.y - 50, '−1 ❤️', '#FF4444');
  effects.push({ type:'hit_flash', life:1, dur:0.35, age:0 });
  if (navigator.vibrate) navigator.vibrate(40);
  const slowTrigger = upgradeFlags.slowMoLives || 1;
  if (state.lives <= slowTrigger && state.lives > 0) { state.timeScale = 0.32; state.slowMoTimer = 3.0; }
  if (state.lives <= 0) triggerGameOver();
}

export function gainLife() {
  if (state.lives >= state.MAX_LIVES) return;
  state.lives++;
  spawnPopup(state.LAUNCHER.x, state.LAUNCHER.y - 50, '+1 ❤️', '#27AE60');
}

export function triggerGameOver() {
  state.gameOver = true;
  document.getElementById('go-state.score').textContent = state.score;
  document.getElementById('go-hi-val').textContent = state.hiScore;
  document.getElementById('gameover-overlay').classList.add('show');
  // Tentative d'ajout au top 10 local
  setTimeout(() => maybeAddHighscore(state.score), 100);
}

/* extracted to module */

export function resetGame() {
  state.score = 0; state.combo = 0; state.comboTimer = 0; state.level = 1; state.lives = 5; state.gameOver = false;
  state.levelUpPaused = false; state.timeScale = 1; state.slowMoTimer = 0;
  state.wetTimer = 0; state.spicyTimer = 0;
  state.spawnTimer = 0; state.objectSpawnTimer = 10; state.gameTime = 0;
  Object.keys(upgradeFlags).forEach(k => delete upgradeFlags[k]); Object.keys(pickCounts).forEach(k => delete pickCounts[k]); state.catsForRegen = 0; state.MAX_LIVES = 7;
  pendingLevelUps.length = 0;
  cats.length = 0; projectiles.length = 0; effects.length = 0; particles.length = 0; popups.length = 0; hairballs.length = 0;
  state.laserHitWidth = 6;
  for (const [id, base] of Object.entries(BASE_PROJ_DEFS)) {
    Object.assign(PROJ_DEFS[id], base);
    rechargeTimers[id] = 0;
  }
  state.runId++;
  state.selectedType = 'pelote';
  unlockedTypes.clear(); unlockedTypes.add('pelote');
  state.activeEvent = null; state.eventBanner = null; state.eventNextIn = 35 + Math.random()*20;
  state.currentScene = SCENES[Math.floor(Math.random() * SCENES.length)];
  checkUnlocks();
  updateHUD();
  document.getElementById('gameover-overlay').classList.remove('show');
}


// ── Trap effects ──────────────────────────────────────────────────────────────
export function applyTrapEffect(cat, px, py) {
  const kind = cat.type.trapKind || 'bomb';
  const x = px || cat.x, y = py || cat.y;
  switch (kind) {
    case 'bomb': {
      loseLife();
      spawnPopup(x, y-20, '💣 BOOM !', '#FF4444');
      spawnParticles(cat.x, cat.y, 16, true);
      break;
    }
    case 'dog': {
      loseLife();
      spawnPopup(x, y-20, '🐶 WAF WAF !', '#FF7B3A');
      spawnParticles(cat.x, cat.y, 14, true);
      // Chats à proximité paniqués : impulsion radiale
      for (const c of cats) {
        if (c.caught || c.isObject) continue;
        const dx = c.x - cat.x, dy = c.y - cat.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < 220) {
          const push = (1 - d/220) * 7;
          c.vx += (dx/d) * push;
          c.vy += (dy/d) * push * 0.4;
        }
      }
      break;
    }
    case 'puddle': {
      state.wetTimer = Math.max(state.wetTimer, 1.5);
      spawnPopup(x, y-20, '💧 Doigts mouillés !', '#5BB6E8');
      spawnParticles(cat.x, cat.y, 12, false);
      break;
    }
    case 'chili': {
      loseLife();
      state.spicyTimer = Math.max(state.spicyTimer, 3.0);
      spawnPopup(x, y-20, '🌶️ ÇA PIQUE !', '#E63946');
      spawnParticles(cat.x, cat.y, 14, true);
      break;
    }
    case 'vacuum': {
      // Vide le stock pelote en cours et déclenche le recharge
      const pdef = PROJ_DEFS.pelote;
      if (pdef.stock > 0) {
        pdef.stock = 0;
        if (rechargeTimers.pelote <= 0) rechargeTimers.pelote = pdef.recharge;
      }
      spawnPopup(x, y-20, '🧹 PELOTES ASPIRÉES !', '#7B7B8E');
      spawnParticles(cat.x, cat.y, 14, true);
      break;
    }
  }
  updateHUD();
}


// ── Effect spawners ───────────────────────────────────────────────────────────
export function explode(p){
  const def=PROJ_DEFS.artifice;
  effects.push({type:'explosion',x:p.x,y:p.y,maxR:def.blastR,life:1,dur:0.7,age:0});
  let caught=0;
  for(const cat of cats){
    if(cat.caught)continue;
    if(Math.hypot(cat.x-p.x,cat.y-p.y)<def.blastR+cat.size*.5){
      catchCat(cat,p.x,p.y,caught>0);
      caught++;
    }
  }
  const multiLabels = ['','','DOUBLE !','TRIPLE !','×4 CHATS !','×5 CHATS !!'];
  if (caught >= 2) spawnPopup(p.x, p.y-55, multiLabels[Math.min(caught,5)] || `×${caught} CHATS !`, '#F1C40F');
  spawnParticles(p.x,p.y,25,false);
  ['#FFD700','#FF6B6B','#4ECDC4','#A29BFE'].forEach(col=>{
    for(let i=0;i<4;i++){
      const a=Math.random()*Math.PI*2,spd=4+Math.random()*8;
      particles.push({x:p.x,y:p.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-4,
        col,sz:6+Math.random()*8,life:1,decay:.012,rot:0,rotSpd:(Math.random()-.5)*.4});
    }
  });
}

export function deployCarton(p){
  const def=PROJ_DEFS.carton;
  effects.push({type:'carton_box',x:p.x,y:p.y,r:def.pullR,life:1,dur:def.pullDur,age:0});
  spawnPopup(p.x,p.y-40,'📦 Carton posé !','#D4A017');
}

