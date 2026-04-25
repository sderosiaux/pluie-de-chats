// Pluie de Chats — entry point (game loop + init)
import { hiValEl } from './dom';
import {
  state, cats, projectiles, effects, particles, popups, hairballs,
  rechargeTimers, upgradeFlags,
} from './state';
import { HUD_H, TYPE_ORDER, SCENES } from './config';
import { ctx } from './canvas';
import { PROJ_DEFS, CAT_TYPES } from './data';
import { CAT_SPRITES } from './sprites';
import { catchCat, drawBossBar, drawXPBar, updateHUD } from './catch';
import { deployCarton, explode, loseLife, spawnParticles, spawnPopup } from './effects';
import { triggerEvent } from './events';
import { drawBackground } from './render-bg';
import { renderCat } from './render-cats';
import { drawEffect, drawProjectileShape } from './render-fx';
import { drawInventory, drawLauncher, drawTrajectory } from './render-ui';
import { spawnCat, spawnInterval, spawnObject } from './spawn';

import './audio';
import './input';
import './menu';
import './bestiary';
import './highscores';
import './unlock';
import './render-cats';
import './render-fx';
import './render-ui';
import './render-bg';
import './spawn';
import './fire';
import './catch';
import './effects';
import './events';
import './levelup';

// DOM bindings
(window as any)._gameCtx = ctx;
if (hiValEl) hiValEl.textContent = String(state.hiScore);

// ── Game loop ──────────────────────────────────────────────
let lastTime = 0;
function loop(ts: number): void {
  let dt = Math.min((ts-lastTime)/1000, 0.05);
  lastTime=ts;
  // Slow-mo
  if (state.slowMoTimer > 0) {
    state.slowMoTimer -= dt;
    if (state.slowMoTimer <= 0) { state.timeScale = 1; state.slowMoTimer = 0; }
  }
  // Slow-aim (upgrade Visée Zen)
  if (upgradeFlags.slowAim && state.slowMoTimer <= 0) {
    state.timeScale = state.isDragging ? 0.45 : 1;
  }
  dt *= state.timeScale;
  state.gameTime += dt;

  // Décrément des timers de trap effects
  if (state.wetTimer > 0)   state.wetTimer = Math.max(0, state.wetTimer - dt);
  if (state.spicyTimer > 0) state.spicyTimer = Math.max(0, state.spicyTimer - dt);

  // Update charge ratio (hold-to-charge) pendant qu'on tient le drag
  if (state.isDragging && state.chargeStart > 0 && state.selectedType !== 'laser') {
    const elapsed = state.gameTime - state.chargeStart;
    const dead = 0.18; // dead zone initiale
    // Surchauffe étend, Charge Rapide raccourcit le temps max
    const maxT = 1.5 * (1 + (upgradeFlags.chargeBonus || 0)) * (upgradeFlags.chargeSpeed || 1);
    // Pré-charge donne un bonus de départ (0..1)
    const baseRatio = upgradeFlags.precharge || 0;
    state.chargeRatio = Math.max(0, Math.min(1, baseRatio + (elapsed - dead) / (maxT - dead)));
  } else if (!state.isDragging) {
    state.chargeRatio = 0;
  }

  drawBackground();
  drawXPBar();
  drawBossBar();

  if (state.menuActive || state.gameOver || state.levelUpPaused || state.hudMenuOpen) { requestAnimationFrame(loop); return; }

  // Trap effect overlays
  if (state.wetTimer > 0) {
    ctx.fillStyle = `rgba(91,182,232,${0.18 * Math.min(1, state.wetTimer)})`;
    ctx.fillRect(0, 0, state.W, state.H);
  }
  if (state.spicyTimer > 0) {
    ctx.fillStyle = `rgba(230,57,70,${0.14 * Math.min(1, state.spicyTimer/3)})`;
    ctx.fillRect(0, 0, state.W, state.H);
  }

  // Vignette rouge pulsante — vies critiques
  if (state.lives <= (upgradeFlags.slowMoLives||1)) {
    const pulse = 0.18 + Math.sin(state.gameTime * 4.5) * 0.1;
    const vg = ctx.createRadialGradient(state.W/2, state.H/2, state.H*0.28, state.W/2, state.H/2, state.H*0.82);
    vg.addColorStop(0, 'rgba(255,0,0,0)');
    vg.addColorStop(1, `rgba(220,0,0,${pulse})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, state.W, state.H);
  }

  // Spawn cats
  state.spawnTimer-=dt;
  let activeCats = 0; for(const c of cats) if(!c.caught&&!c.isObject) activeCats++;
  if(state.spawnTimer<=0){ const cap = upgradeFlags.cheatMode ? 25 : 7; if(activeCats < cap) spawnCat(); state.spawnTimer=spawnInterval(); }
  state.objectSpawnTimer-=dt;
  if(state.objectSpawnTimer<=0){spawnObject();state.objectSpawnTimer = upgradeFlags.cheatMode ? 1 + Math.random()*2 : 8+Math.random()*10;}

  // Recharge
  for(const id of TYPE_ORDER){
    const def=PROJ_DEFS[id];
    if(def.stock<def.maxStock && rechargeTimers[id]>0){
      rechargeTimers[id]-=dt;
      if(rechargeTimers[id]<=0){
        def.stock++;
        rechargeTimers[id] = def.stock < def.maxStock ? def.recharge : 0;
      }
    }
  }

  // Combo decay
  if(state.combo > 0){
    state.comboTimer -= dt;
    if(state.comboTimer <= 0){ state.combo = 0; state.comboTimer = 0; updateHUD(); }
  }

  // ── Events ────────────────────────────────────────────────────────────────────
  state.eventNextIn -= dt;
  if (state.eventNextIn <= 0 && !state.activeEvent) triggerEvent();
  if (state.activeEvent) {
    state.activeEvent.timer -= dt;
    if (state.activeEvent.timer <= 0) state.activeEvent = null;
  }
  if (state.eventBanner) {
    state.eventBanner.age += dt;
    const t = state.eventBanner.age / state.eventBanner.dur;
    const a = t < 0.12 ? t/0.12 : t > 0.75 ? Math.max(0,(1-t)/0.25) : 1;
    if (a > 0) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = state.eventBanner.col + 'cc';
      const hasDesc = !!state.eventBanner.desc;
      const bw = Math.min(state.W*0.82, 400), bh = hasDesc ? 76 : 58, bx=(state.W-bw)/2, by=state.H*.38;
      ctx.shadowColor=state.eventBanner.col; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,28); ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle='white'; ctx.textAlign='center';
      ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=6;
      const nameY = hasDesc ? by + bh*0.38 : by + bh/2;
      ctx.font=`bold ${Math.round(hasDesc ? bh*.34 : bh*.45)}px "Arial Rounded MT Bold",Arial`;
      ctx.textBaseline='middle';
      ctx.fillText(state.eventBanner.text, state.W/2, nameY);
      if (hasDesc) {
        ctx.font=`${Math.round(bh*.22)}px "Arial Rounded MT Bold",Arial`;
        ctx.globalAlpha = a * 0.85;
        ctx.fillText(state.eventBanner.desc, state.W/2, by + bh*0.72);
      }
      ctx.restore();
    }
    if (t >= 1) state.eventBanner = null;
  }

  // Update cats
  for(let i=cats.length-1;i>=0;i--){
    const c=cats[i];
    if(!c.caught){
      {
        // Zigzag movement
        if (c.type.id==='zigzag') c.vx = Math.sin(state.gameTime*4.5 + c.wobble)*4.2;
      }
      const spicyBoost = state.spicyTimer > 0 && !c.isObject ? 1.7 : 1;
      c.x+=c.vx * spicyBoost; c.y+=c.vy * spicyBoost;
      c.wobble+=c.wobbleSpd;
      c.rot=Math.sin(c.wobble)*.09;
      // Furtif visibility toggle
      if (c.type.id==='furtif') {
        c.visTimer-=dt;
        if (c.visTimer<=0) { c.visible=!c.visible; c.visTimer=c.visible?1.1:.65; }
      }
      // Shield flash decay
      if (c.shieldFlash>0) c.shieldFlash-=dt*5;
      // Lure forces des décors ground (croquettes attire, souris repousse)
      if (!c.isObject) {
        for (const e of effects) {
          if (e.type !== 'ground_decor' || !e.lureKind || !e.lureRadius) continue;
          const lx = e.x || 0, ly = e.y || 0;
          const dx = lx - c.x, dy = ly - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist > e.lureRadius || dist < 1) continue;
          const force = (1 - dist / e.lureRadius) * 0.18;
          const sign = e.lureKind === 'attract' ? 1 : -1;
          c.vx += (dx / dist) * force * sign;
          c.vy += (dy / dist) * force * sign;
        }
      }
      // Griffeur — fonce vers le lanceur
      if (c.type.id==='griffeur') {
        const dx=state.LAUNCHER.x-c.x, dy=state.LAUNCHER.y-c.y, dist=Math.hypot(dx,dy);
        if (dist > 1) { c.vx+=(dx/dist)*.18; c.vy+=(dy/dist)*.18; }
        const spd=Math.hypot(c.vx,c.vy);
        if (spd>6) { c.vx=c.vx/spd*6; c.vy=c.vy/spd*6; }
        if (dist < c.size + 32) { loseLife(); spawnPopup(c.x,c.y,'GRIFFE !','#FF6B35'); c.caught=true; }
      }
      // ── Boss state machine ────────────────────────────────────────────────
      if (c.type.id === 'boss') {
        const targetY = HUD_H + 100;
        if (c.bossState === 'entering') {
          if (c.y >= targetY) {
            c.bossState = 'idle';
            c.bossAnchorX = state.W / 2;  // hover centré
            c.bossAttackTimer = 1.5;
            c.vy = 0;
            c.vx = 0;
          }
        } else {
          // Hover : oscillation horizontale autour de l'ancre, vertical léger
          c.bossWobble += dt * 1.3;
          c.x = c.bossAnchorX + Math.sin(c.bossWobble) * (state.W * 0.32);
          c.y = targetY + Math.sin(c.bossWobble * 0.8) * 12;
          c.vx = 0; c.vy = 0;
          // Attaques cycliques
          c.bossAttackTimer -= dt;
          if (c.bossAttackTimer <= 0) {
            c.bossAttackTimer = 2.0 + Math.random() * 1.4;
            const kind = Math.floor(Math.random() * 2);
            if (kind === 0) {
              // Spit hairball spread (3 in fan toward launcher)
              const dx = state.LAUNCHER.x - c.x, dy = state.LAUNCHER.y - c.y;
              const baseAng = Math.atan2(dy, dx);
              const spd = 4.2;
              for (let k = -1; k <= 1; k++) {
                const a = baseAng + k * 0.28;
                hairballs.push({
                  x: c.x, y: c.y + c.size * 0.5,
                  vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                  r: 10, age: 0, dur: 6, catId: c.id,
                });
              }
              spawnPopup(c.x, c.y - c.size, '👑 Cracha !', '#C0392B');
            } else {
              // Lance 1-2 chats méchants depuis sa position
              const enemyTypes = CAT_TYPES.filter(t => ['griffeur','crachat','noir'].includes(t.id));
              const n = 1 + Math.floor(Math.random() * 2);
              for (let k = 0; k < n; k++) {
                const eType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                const s2 = Math.max(16, 22 * eType.size);
                cats.push({
                  id: ++state._catIdCounter,
                  x: c.x + (Math.random()-0.5) * 30,
                  y: c.y + c.size * 0.5,
                  vx: (Math.random()-0.5) * 2.5,
                  vy: 2.5 + Math.random() * 1.5,
                  size: s2, type: eType, rot: 0,
                  wobble: Math.random()*Math.PI*2, wobbleSpd: .008+Math.random()*.006,
                  caught: false, catchAnim: 1,
                  hp: eType.hp || 1, maxHp: eType.hp || 1, shieldFlash: 0,
                  bossState: null, bossAttackTimer: 0, bossAttackKind: 0, bossAnchorX: 0, bossWobble: 0,
                  visible: true, visTimer: 1.2,
                  spitTimer: eType.id === 'crachat' ? 1.5 + Math.random()*1.0 : 0,
                  lucky: false,
                  spriteFlip: Math.random() < 0.5,
                  spriteRot: 0,
                  poseIdx: CAT_SPRITES[eType.id] ? Math.floor(Math.random() * CAT_SPRITES[eType.id].length) : 0,
                  spriteScale: 0.85,
                  speech: null,
                });
              }
              spawnPopup(c.x, c.y - c.size, '👑 Sbires !', '#C0392B');
            }
          }
        }
      }

      // Crachat — crache des boules de poils
      if (c.type.id==='crachat') {
        c.spitTimer -= dt;
        if (c.spitTimer <= 0) {
          c.spitTimer = 2.2 + Math.random()*1.5;
          const dx=state.LAUNCHER.x-c.x, dy=state.LAUNCHER.y-c.y, d=Math.hypot(dx,dy);
          const spd=2.8+Math.random()*.8;
          hairballs.push({ x:c.x, y:c.y, vx:(dx/d)*spd, vy:(dy/d)*spd, r:8, age:0, dur:5, catId:c.id });
        }
      }
      // Tireur Mafia — tire une balle vers le launcher toutes les ~3s
      if (c.type.id==='tireur') {
        c.spitTimer -= dt;
        if (c.spitTimer <= 0) {
          c.spitTimer = 2.5 + Math.random()*1.0;
          const dx = state.LAUNCHER.x - c.x, dy = state.LAUNCHER.y - c.y;
          const d = Math.hypot(dx, dy) || 1;
          const spd = 5.5;
          effects.push({
            type: 'enemyBullet', x: c.x, y: c.y + c.size * 0.3,
            vx: (dx/d) * spd, vy: (dy/d) * spd,
            life: 1, dur: 4, age: 0, ownerId: c.id,
          });
        }
      }
      if(c.x<c.size||c.x>state.W-c.size){c.vx*=-1;c.x=Math.max(c.size,Math.min(state.W-c.size,c.x));}
      // Indestructibles : au contact du sol → se transforment en décor (lure attract/repel) puis disparaissent du pool cats
      if (c.type.unbreakable && c.y >= state.H - state.DECOR_H + c.size * 0.4) {
        effects.push({
          type: 'ground_decor',
          x: c.x, y: state.H - state.DECOR_H + c.size * 0.4,
          spriteId: c.type.id,
          lureKind: c.type.lureKind || null,
          lureRadius: c.type.lureKind ? 140 : 0,
          size: c.size * 1.6,
          life: 1, dur: 8, age: 0,
        });
        cats.splice(i,1);continue;
      }
      if(c.y>state.H+c.size){
        // Bombe tombée au sol = esquivée, aucun malus
        if(!c.isObject && c.type.pts>0){ state.combo=0; updateHUD(); }
        cats.splice(i,1);continue;
      }
    } else {
      c.catchAnim-=.075; c.y-=4; c.size*=.96;
      if(c.catchAnim<=0){cats.splice(i,1);continue;}
    }
    renderCat(c);
  }

  // Night overlay — après les chats pour les assombrir (ciel déjà sombre, overlay plus léger)
  if (state.activeEvent && state.activeEvent.id === 'nuit') {
    ctx.fillStyle = 'rgba(8,4,28,0.42)';
    ctx.fillRect(0, 0, state.W, state.H);
  }

  // Draw trajectory preview
  drawTrajectory();

  // Update & draw projectiles
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    if(!p.active){projectiles.splice(i,1);continue;}

    // trail
    p.trailTimer+=dt;
    if(p.trailTimer>.03){p.trail.push({x:p.x,y:p.y});if(p.trail.length>12)p.trail.shift();p.trailTimer=0;}

    p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity;
    p.rot+=p.rotSpd;

    // wall bounce
    if(p.x<p.r){p.x=p.r;p.vx*=-1;p.bounces--;}
    if(p.x>state.W-p.r){p.x=state.W-p.r;p.vx*=-1;p.bounces--;}
    if(p.bounces<0&&p.vx!==0&&(p.x<=p.r||p.x>=state.W-p.r)){p.active=false;projectiles.splice(i,1);continue;}

    // distance-based explosion for artifice
    if(p.type==='artifice'){
      p.distTraveled = (p.distTraveled||0) + Math.hypot(p.vx, p.vy);
      if(p.fuseDistance > 0 && p.distTraveled >= p.fuseDistance){explode(p);projectiles.splice(i,1);continue;}
      p.fuseTimer-=dt;
      if(p.fuseTimer<=0){explode(p);projectiles.splice(i,1);continue;}
    }

    // collision with cats
    let hitCount=0;
    for(const cat of cats){
      if(cat.caught)continue;
      // Indestructibles : projectiles passent à travers (plume/souris/croquettes)
      if(cat.type.unbreakable)continue;
      // Furtif: invincible quand invisible
      if(cat.type.id==='furtif'&&!cat.visible)continue;
      const dist=Math.hypot(cat.x-p.x, cat.y-p.y);
      const hitR = cat.size + p.r;
      if(dist<hitR){
        if(p.type==='artifice') continue; // passe au travers, explose sur distance
        if(p.type==='carton'){deployCarton(p);projectiles.splice(i,1);hitCount=999;break;}
        // Multi-HP cats
        if(cat.hp>1){
          cat.hp--; cat.shieldFlash=1;
          spawnParticles(cat.x,cat.y,6,false);
          spawnPopup(cat.x,cat.y-cat.size,'💥','#4FC3F7');
          if(p.type==='pelote'){const nd=upgradeFlags.peloteNoDampen;p.vx*=nd?-1:-0.6;p.vy*=nd?-1:-0.7;}
          else{p.active=false;break;}
        } else {
          catchCat(cat,p.x,p.y,false);
          hitCount++;
          if(p.type==='pelote'&&hitCount>=1){const nd=upgradeFlags.peloteNoDampen;p.vx*=nd?-1:-0.6;p.vy*=nd?-1:-0.7;}
          if(hitCount>=1&&p.type!=='pelote'){p.active=false;break;}
        }
      }
    }
    if(!p.active)continue;

    // off-screen (bottom or top after HUD) — disparaît silencieusement, aucun effet déclenché
    if(p.y>state.H+20||p.y<HUD_H){
      projectiles.splice(i,1);continue;
    }

    drawProjectileShape(p);
  }

  // Update & draw effects
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];
    e.age=(e.age||0)+dt;
    e.life=Math.max(0,1-e.age/e.dur);
    if(e.life<=0){effects.splice(i,1);continue;}

    // laser: continuous hit detection while beam is alive
    if(e.type==='active_laser'){
      const segDx=e.x2-e.x1, segDy=e.y2-e.y1, segLen2=segDx*segDx+segDy*segDy;
      for(const cat of cats){
        if(cat.caught||e.caughtIds.has(cat.id))continue;
        if(cat.type.id==='furtif'&&!cat.visible)continue;
        const proj=((cat.x-e.x1)*segDx+(cat.y-e.y1)*segDy)/segLen2;
        const cp=Math.max(0,Math.min(1,proj));
        const cx2=e.x1+cp*segDx, cy2=e.y1+cp*segDy;
        if(Math.hypot(cat.x-cx2,cat.y-cy2)<cat.size*1.1+state.laserHitWidth){
          e.caughtIds.add(cat.id);
          catchCat(cat,cat.x,cat.y,e.caught>0);
          e.caught++;
        }
      }
      if(e.age>e.dur-0.05&&e.caught===0&&!e.shownMissMsg){e.shownMissMsg=true;spawnPopup(e.x1,e.y1-40,'Raté !','rgba(255,255,255,0.8)');}
      if(e.caught>=3&&!e.shownMultiMsg){e.shownMultiMsg=true;spawnPopup(e.x1,e.y1-60,`LASER ×${e.caught} !!`,'#FF1744');}
    }

    // carton: pull cats
    if(e.type==='carton_box'){
      for(const cat of cats){
        if(cat.caught)continue;
        const d=Math.hypot(cat.x-e.x,cat.y-e.y);
        if(d<e.r){
          const safeD=Math.max(d,0.001);
          const force=3.5/Math.max(10,safeD*.2);
          cat.vx+=(e.x-cat.x)/safeD*force;
          cat.vy+=(e.y-cat.y)/safeD*force;
          if(d<22)catchCat(cat,e.x,e.y,false);
        }
      }
    }

    // enemyBullet: balle tirée par un Tireur Mafia → vol en ligne droite, kill au contact launcher
    if (e.type === 'enemyBullet') {
      e.x = (e.x || 0) + (e.vx || 0);
      e.y = (e.y || 0) + (e.vy || 0);
      // Hors écran → expire
      if (e.y > state.H + 20 || e.x < -20 || e.x > state.W + 20 || e.y < -20) {
        effects.splice(i, 1); continue;
      }
      // Collision launcher
      const dx = state.LAUNCHER.x - (e.x || 0);
      const dy = state.LAUNCHER.y - (e.y || 0);
      if (Math.hypot(dx, dy) < 28) {
        loseLife();
        spawnParticles(e.x || 0, e.y || 0, 8, true);
        effects.splice(i, 1); continue;
      }
    }

    drawEffect(e);
  }

  // Hairballs
  for (let i=hairballs.length-1;i>=0;i--) {
    const hb=hairballs[i];
    hb.x+=hb.vx; hb.y+=hb.vy; hb.age+=dt;
    if (hb.age>hb.dur||hb.y>state.H||hb.x<-20||hb.x>state.W+20) { hairballs.splice(i,1); continue; }
    // Hit by projectile?
    let destroyed=false;
    for (const p of projectiles) {
      if (Math.hypot(hb.x-p.x,hb.y-p.y)<22) {
        spawnPopup(hb.x,hb.y,'Esquivé !','#ffce3a');
        spawnParticles(hb.x,hb.y,6,false);
        destroyed=true; break;
      }
    }
    if (destroyed) { hairballs.splice(i,1); continue; }
    // Hit launcher?
    if (Math.hypot(hb.x-state.LAUNCHER.x,hb.y-state.LAUNCHER.y)<32) {
      loseLife(); spawnPopup(state.LAUNCHER.x,state.LAUNCHER.y-44,'TOUCHÉ !','#FF4444');
      hairballs.splice(i,1); continue;
    }
    // Draw — green hairball
    ctx.save();
    const wb=Math.sin(hb.age*9)*.18;
    ctx.fillStyle='#3dc47e';
    ctx.shadowColor='#3dc47e'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.ellipse(hb.x,hb.y,hb.r*(1+wb),hb.r*(1-wb),hb.age*2,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.3)';
    ctx.beginPath(); ctx.ellipse(hb.x-hb.r*.28,hb.y-hb.r*.28,hb.r*.32,hb.r*.22,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // Launcher
  drawLauncher();
  // Lives sont affichées dans le HUD (livesEl) — pas besoin de doublon canvas


  // Inventory
  drawInventory();

  // Particles
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx;p.y+=p.vy;p.vy+=.22;p.vx*=.984;
    p.rot+=p.rotSpd;p.life-=p.decay;
    if(p.life<=0){particles.splice(i,1);continue;}
    ctx.save();ctx.globalAlpha=p.life;ctx.translate(p.x,p.y);ctx.rotate(p.rot);
    ctx.fillStyle=p.col;ctx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz*.6);
    ctx.restore();
  }

  // Popups
  for(let i=popups.length-1;i>=0;i--){
    const sp=popups[i];
    sp.y+=sp.vy;sp.life-=.022;
    if(sp.life<=0){popups.splice(i,1);continue;}
    const psz = Math.round(22 * Math.min(1, sp.life * 3.5));
    ctx.save(); ctx.globalAlpha = sp.life;
    ctx.font = `900 ${psz}px "Baloo 2",Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#fff8e6'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.strokeText(sp.text, sp.x, sp.y);
    ctx.fillStyle = sp.col; ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 3;
    ctx.fillText(sp.text, sp.x, sp.y);
    ctx.restore();
  }

  // Message statique (recharge) — sprite + texte si fourni
  if (state.staticMsg) {
    state.staticMsg.age += dt;
    const t = state.staticMsg.age / state.staticMsg.dur;
    if (t >= 1) { state.staticMsg = null; }
    else {
      const msg = state.staticMsg;
      const alpha = t < 0.15 ? t/0.15 : t > 0.7 ? 1-(t-0.7)/0.3 : 1;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.font = `900 24px "Baloo 2",Arial`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

      // Mesure le texte pour pouvoir centrer (sprite + texte) autour de msg.x
      const textW = ctx.measureText(msg.text).width;
      const sprite = msg.sprite;
      const spriteSize = 36;
      const gap = 8;
      const totalW = (sprite ? spriteSize + gap : 0) + textW;
      const startX = msg.x - totalW / 2;

      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        ctx.drawImage(sprite, startX, msg.y - spriteSize / 2, spriteSize, spriteSize);
      }
      const textX = startX + (sprite ? spriteSize + gap : 0);
      ctx.strokeStyle = '#2a1b4a'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
      ctx.strokeText(msg.text, textX, msg.y);
      ctx.fillStyle = msg.col;
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4;
      ctx.fillText(msg.text, textX, msg.y);
      ctx.restore();
    }
  }

  requestAnimationFrame(loop);
}
// ── Init ──────────────────────────────────────────────
state.currentScene = SCENES[Math.floor(Math.random() * SCENES.length)];
updateHUD();
requestAnimationFrame(loop);
