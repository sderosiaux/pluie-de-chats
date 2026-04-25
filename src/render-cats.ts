// @ts-nocheck
import { state } from './state';
import { ctx } from './canvas';
import { CAT_TYPES, OBJECT_TYPES } from './data';
import { CAT_SPRITES, OBJECT_SPRITES, WEAPON_SPRITES } from './sprites';

// ── Cat types & drawing (reused from v1) ──────────────────────────────────────
/* extracted to module */


// ── Profession cat base body (shared) ────────────────────────────────────────
export function drawProfBase(s, col) {
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.ellipse(0,s*.1,s*.56,s*.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-s*.355,s*.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s*.36,-s*.62); ctx.lineTo(-s*.19,-s*.93); ctx.lineTo(-s*.02,-s*.65); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.02,-s*.65); ctx.lineTo( s*.19,-s*.93); ctx.lineTo( s*.36,-s*.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#FFB5C8';
  ctx.beginPath(); ctx.moveTo(-s*.30,-s*.65); ctx.lineTo(-s*.20,-s*.84); ctx.lineTo(-s*.09,-s*.67); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.09,-s*.67); ctx.lineTo( s*.20,-s*.84); ctx.lineTo( s*.30,-s*.65); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#2C3E50';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.375,s*.092,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.375,s*.092,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.ellipse(-s*.145,-s*.375,s*.052,s*.078,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.145,-s*.375,s*.052,s*.078,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(-s*.105,-s*.412,s*.028,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.175,-s*.412,s*.028,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FF8FAB';
  ctx.beginPath(); ctx.moveTo(-s*.055,-s*.268); ctx.lineTo(s*.055,-s*.268); ctx.lineTo(0,-s*.228); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#666'; ctx.lineWidth=s*.024; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,-s*.228); ctx.quadraticCurveTo(-s*.1,-s*.155,-s*.14,-s*.18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-s*.228); ctx.quadraticCurveTo( s*.1,-s*.155, s*.14,-s*.18); ctx.stroke();
  ctx.fillStyle='rgba(255,127,179,0.52)';
  ctx.beginPath(); ctx.ellipse(-s*.29,-s*.19,s*.12,s*.07,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.29,-s*.19,s*.12,s*.07,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(120,120,120,0.4)'; ctx.lineWidth=1.0;
  [[-s*.055,-s*.26,-s*.38,-s*.32],[-s*.055,-s*.26,-s*.37,-s*.24],
   [ s*.055,-s*.26, s*.38,-s*.32],[ s*.055,-s*.26, s*.37,-s*.24]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  ctx.strokeStyle=col; ctx.lineWidth=s*.135; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(s*.45,s*.2); ctx.quadraticCurveTo(s*.88,-s*.08,s*.56,-s*.62); ctx.stroke();
}
export function drawPompier(s) {
  drawProfBase(s, '#CC3300');
  ctx.fillStyle='#CC0000';
  ctx.beginPath(); ctx.ellipse(0,-s*.75,s*.56,s*.16,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.82,s*.3,s*.28,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFD700';
  ctx.beginPath(); ctx.arc(0,-s*.93,s*.07,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(255,220,0,0.7)'; ctx.lineWidth=s*.04;
  ctx.beginPath(); ctx.arc(0,-s*.82,s*.15,0,Math.PI*2); ctx.stroke();
}
export function drawBoulanger(s) {
  drawProfBase(s, '#E8C9A0');
  ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.rect(-s*.26,-s*.62-s*.52,s*.52,s*.52); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.62-s*.52,s*.26,s*.14,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(200,200,200,0.6)';
  ctx.beginPath(); ctx.ellipse(0,-s*.62,s*.3,s*.08,0,0,Math.PI*2); ctx.fill();
}
export function drawNinja(s) {
  drawProfBase(s, '#2C2C2C');
  ctx.fillStyle='#8B0000';
  ctx.save(); ctx.beginPath();
  ctx.arc(0,-s*.355,s*.45,Math.PI*0.65,Math.PI*0.35); ctx.fill(); ctx.restore();
  ctx.strokeStyle='#6A0000'; ctx.lineWidth=s*.06;
  ctx.beginPath(); ctx.arc(0,-s*.355,s*.44,Math.PI*0.7,Math.PI*0.3); ctx.stroke();
  ctx.fillStyle='rgba(20,20,20,0.85)';
  ctx.beginPath(); ctx.ellipse(0,-s*.22,s*.36,s*.15,0,0,Math.PI*2); ctx.fill();
}
export function drawDetective(s) {
  drawProfBase(s, '#7F8C8D');
  ctx.fillStyle='#4A3020';
  ctx.beginPath(); ctx.ellipse(0,-s*.72-s*.38,s*.28,s*.38,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.rect(-s*.3,-s*.72-s*.04,s*.6,s*.1); ctx.fill();
  ctx.fillStyle='#5D4037';
  ctx.beginPath(); ctx.ellipse(0,-s*.72,s*.58,s*.1,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(200,200,200,0.85)'; ctx.lineWidth=s*.045;
  ctx.beginPath(); ctx.arc(s*.54,s*.22,s*.13,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s*.64,s*.33); ctx.lineTo(s*.76,s*.46); ctx.stroke();
}
export function drawPirate(s) {
  drawProfBase(s, '#D4A55A');
  ctx.fillStyle='#8B1A1A';
  ctx.save(); ctx.beginPath();
  ctx.arc(0,-s*.355,s*.44,Math.PI*1.1,Math.PI*1.9); ctx.fill(); ctx.restore();
  ctx.fillStyle='#1A1A1A';
  ctx.beginPath(); ctx.ellipse(-s*.145,-s*.375,s*.1,s*.075,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#3A2A10'; ctx.lineWidth=s*.038;
  ctx.beginPath(); ctx.moveTo(-s*.24,-s*.33); ctx.lineTo(-s*.04,-s*.33); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.arc(s*.05,-s*.43,s*.065,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.7)'; ctx.lineWidth=s*.03;
  [[-s*.01,-s*.39,s*.01,-s*.47],[s*.09,-s*.43,s*.01,-s*.43]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
}
export function drawPolicier(s) {
  drawProfBase(s, '#1A3A6B');
  ctx.fillStyle='#1A3A6B';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.34,s*.24,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.rect(-s*.3,-s*.79,s*.6,s*.08); ctx.fill();
  ctx.fillStyle='#FFD700';
  ctx.beginPath(); ctx.arc(0,-s*.91,s*.06,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFD700'; ctx.font=`bold ${s*.2}px sans-serif`; ctx.textAlign='center';
  ctx.fillText('★',0,s*.12);
}
export function drawMagicien(s) {
  drawProfBase(s, '#4A0E8F');
  ctx.fillStyle='#2E0068';
  ctx.beginPath(); ctx.moveTo(-s*.3,-s*.72); ctx.lineTo(0,-s*1.3); ctx.lineTo(s*.3,-s*.72); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.72,s*.32,s*.1,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFD700';
  [[s*.15,-s*.9],[- s*.22,-s*.84],[s*.02,-s*1.18]].forEach(([x,y])=>{
    ctx.beginPath(); ctx.arc(x,y,s*.035,0,Math.PI*2); ctx.fill();
  });
  ctx.strokeStyle='#FFD700'; ctx.lineWidth=s*.04;
  ctx.beginPath(); ctx.moveTo(s*.5,s*.25); ctx.lineTo(s*.76,s*.0); ctx.stroke();
}
export function drawCowboy(s) {
  drawProfBase(s, '#C19A6B');
  ctx.fillStyle='#8B5E3C';
  ctx.beginPath(); ctx.ellipse(0,-s*.76,s*.52,s*.1,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.83,s*.3,s*.2,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#C19A6B';
  ctx.beginPath(); ctx.ellipse(0,-s*.76,s*.65,s*.08,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#FFD700'; ctx.lineWidth=s*.03;
  ctx.beginPath(); ctx.arc(0,-s*.77,s*.08,0,Math.PI*2); ctx.stroke();
}
export function drawViking(s) {
  drawProfBase(s, '#C0956B');
  ctx.fillStyle='#808080';
  ctx.beginPath(); ctx.ellipse(0,-s*.8,s*.36,s*.22,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.rect(-s*.32,-s*.82,s*.64,s*.1); ctx.fill();
  ctx.fillStyle='#A0A0A0';
  ctx.beginPath(); ctx.ellipse(-s*.4,-s*.76,s*.12,s*.2,-.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.4,-s*.76,s*.12,s*.2, .3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#D4A017';
  ctx.beginPath(); ctx.moveTo(-s*.15,-s*.56); ctx.lineTo(-s*.32,-s*.56); ctx.lineTo(-s*.24,-s*.69); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.15,-s*.56); ctx.lineTo( s*.32,-s*.56); ctx.lineTo( s*.24,-s*.69); ctx.closePath(); ctx.fill();
}
export function drawSorciere(s) {
  drawProfBase(s, '#2D2D2D');
  ctx.fillStyle='#1A1A1A';
  ctx.beginPath(); ctx.moveTo(-s*.35,-s*.72); ctx.lineTo(0,-s*1.35); ctx.lineTo(s*.35,-s*.72); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.72,s*.38,s*.1,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#6A0DAD';
  ctx.beginPath(); ctx.ellipse(0,-s*.72,s*.25,s*.06,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#00CC44';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.375,s*.05,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.375,s*.05,0,Math.PI*2); ctx.fill();
}
export function drawMarin(s) {
  drawProfBase(s, '#2C5F8A');
  ctx.fillStyle='#1A3A5C';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.3,s*.18,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.rect(-s*.28,-s*.79,s*.56,s*.07); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.2,s*.12,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#1A3A5C'; ctx.lineWidth=s*.025;
  for(let i=-1;i<=1;i+=2){
    ctx.beginPath(); ctx.moveTo(-s*.14,-s*.04+i*s*.12); ctx.lineTo(s*.14,-s*.04+i*s*.12); ctx.stroke();
  }
}
export function drawGamer(s) {
  drawProfBase(s, '#1A1A2E');
  ctx.fillStyle='#16213E';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.34,s*.22,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#E94560'; ctx.font=`bold ${s*.22}px sans-serif`; ctx.textAlign='center';
  ctx.fillText('▶',0,-s*.75);
  ctx.fillStyle='#0F3460';
  ctx.beginPath(); ctx.ellipse(-s*.28,s*.05,s*.18,s*.12,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.28,s*.05,s*.18,s*.12,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#E94560';
  ctx.beginPath(); ctx.arc(-s*.28,s*.05,s*.04,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.28,s*.05,s*.04,0,Math.PI*2); ctx.fill();
}
export function drawScientifique(s) {
  drawProfBase(s, '#F0F0F0');
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.rect(-s*.3,-s*.06,s*.6,s*.55); ctx.fill();
  ctx.strokeStyle='#CCCCCC'; ctx.lineWidth=s*.02;
  ctx.beginPath(); ctx.rect(-s*.3,-s*.06,s*.6,s*.55); ctx.stroke();
  ctx.fillStyle='#3498DB';
  ctx.beginPath(); ctx.ellipse(0,s*.52,s*.1,s*.14,.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,s*.66,s*.14,s*.1,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#95A5A6'; ctx.lineWidth=s*.025;
  [-s*.12,0,s*.12].forEach(x=>{
    ctx.beginPath(); ctx.moveTo(x,s*.0); ctx.lineTo(x,s*.35); ctx.stroke();
  });
}
export function drawArtiste(s) {
  drawProfBase(s, '#8B4513');
  ctx.fillStyle='#5D2E0C';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.28,s*.2,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#E74C3C'; ctx.beginPath(); ctx.arc(-s*.12,-s*.78,s*.06,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3498DB'; ctx.beginPath(); ctx.arc( s*.0,-s*.76,s*.05,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#F1C40F'; ctx.beginPath(); ctx.arc( s*.12,-s*.78,s*.06,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#5D2E0C'; ctx.lineWidth=s*.04;
  ctx.beginPath(); ctx.moveTo(s*.5,s*.2); ctx.lineTo(s*.7,s*.0); ctx.lineTo(s*.65,-s*.15); ctx.stroke();
  ctx.fillStyle='#E8C49A';
  ctx.beginPath(); ctx.ellipse(s*.68,-s*.14,s*.06,s*.04,-.5,0,Math.PI*2); ctx.fill();
}
export function drawJardinier(s) {
  drawProfBase(s, '#5D8233');
  ctx.fillStyle='#3D5C1E';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.36,s*.2,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.24,s*.32,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#6AB04C';
  [[-s*.18,-s*.93],[ s*.12,-s*.98],[-s*.04,-s*1.04]].forEach(([x,y])=>{
    ctx.beginPath(); ctx.ellipse(x,y,s*.08,s*.12,Math.random()*.6-.3,0,Math.PI*2); ctx.fill();
  });
  ctx.strokeStyle='#8B5E3C'; ctx.lineWidth=s*.04;
  ctx.beginPath(); ctx.moveTo(-s*.5,s*.2); ctx.lineTo(-s*.72,s*.65); ctx.stroke();
}
export function drawChevalier(s) {
  drawProfBase(s, '#8A8A8A');
  ctx.fillStyle='#5A5A5A';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.38,s*.26,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.rect(-s*.32,-s*.82,s*.64,s*.1); ctx.fill();
  ctx.fillStyle='#7A7A7A';
  ctx.beginPath(); ctx.rect(-s*.12,-s*.88,s*.24,s*.14); ctx.fill();
  ctx.strokeStyle='#4A4A4A'; ctx.lineWidth=s*.025;
  for(let i=0;i<3;i++) {
    ctx.beginPath(); ctx.moveTo(-s*.1,-s*.82+i*s*.05); ctx.lineTo(s*.1,-s*.82+i*s*.05); ctx.stroke();
  }
  ctx.strokeStyle='#C0C0C0'; ctx.lineWidth=s*.045;
  ctx.beginPath(); ctx.moveTo(s*.5,s*.2); ctx.lineTo(s*.5,-s*.5); ctx.lineTo(s*.5,-s*.5); ctx.stroke();
  ctx.strokeStyle='#A0A0A0'; ctx.lineWidth=s*.03;
  ctx.beginPath(); ctx.moveTo(s*.38,-s*.42); ctx.lineTo(s*.62,-s*.42); ctx.stroke();
}
export function drawMusicien(s) {
  drawProfBase(s, '#2C1810');
  ctx.fillStyle='#1A0F0A';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.3,s*.22,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FF6B6B';
  ctx.beginPath(); ctx.arc(0,-s*.88,s*.04,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#8B4513'; ctx.lineWidth=s*.04;
  ctx.beginPath(); ctx.moveTo(-s*.5,s*.1); ctx.lineTo(-s*.7,-s*.4); ctx.stroke();
  ctx.fillStyle='#D4A017';
  ctx.beginPath(); ctx.ellipse(-s*.7,-s*.38,s*.1,s*.06,-.3,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#8B4513'; ctx.lineWidth=s*.02;
  for(let i=0;i<4;i++){
    ctx.beginPath(); ctx.moveTo(-s*.65,-s*.44); ctx.lineTo(-s*.65+i*s*.04,-s*.28); ctx.stroke();
  }
}
export function drawCuisinier(s) {
  drawProfBase(s, '#F5F5DC');
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.rect(-s*.22,-s*.72,s*.44,s*.3); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.72,s*.22,s*.14,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.98,s*.22,s*.28,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#CCCCCC'; ctx.lineWidth=s*.015;
  ctx.beginPath(); ctx.rect(-s*.22,-s*.72,s*.44,s*.3); ctx.stroke();
  ctx.fillStyle='#E74C3C';
  ctx.beginPath(); ctx.arc(0,s*.05,s*.04,0,Math.PI*2); ctx.fill();
}
export function drawClown(s) {
  drawProfBase(s, '#FF6B9D');
  ctx.fillStyle='#FF0066';
  ctx.beginPath(); ctx.arc(0,-s*.28,s*.1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFD700';
  ctx.beginPath(); ctx.ellipse(-s*.45,-s*.5,s*.22,s*.14,-.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.45,-s*.5,s*.22,s*.14, .4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FF6B9D';
  ctx.beginPath(); ctx.ellipse(-s*.45,-s*.5,s*.14,s*.09,-.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.45,-s*.5,s*.14,s*.09, .4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#00C8FF';
  ctx.beginPath(); ctx.rect(-s*.15,-s*.1,s*.3,s*.36); ctx.fill();
  ctx.fillStyle='#FF6B9D';
  ctx.beginPath(); ctx.rect(-s*.14,-s*.09,s*.28,s*.34); ctx.fill();
}
export function drawRobot(s) {
  drawProfBase(s, '#7F8C8D');
  ctx.fillStyle='#5D6D7E';
  ctx.beginPath(); ctx.rect(-s*.3,-s*.78,s*.6,s*.42); ctx.fill();
  ctx.fillStyle='#2ECC71';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.6,s*.07,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.6,s*.07,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(46,204,113,0.3)';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.6,s*.12,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.6,s*.12,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#95A5A6'; ctx.lineWidth=s*.02;
  ctx.beginPath(); ctx.rect(-s*.2,-s*.44,s*.4,s*.08); ctx.stroke();
  ctx.fillStyle='#E74C3C'; ctx.fillRect(-s*.18,-s*.43,s*.1,s*.06);
  ctx.fillStyle='#2ECC71'; ctx.fillRect(-s*.04,-s*.43,s*.22,s*.06);
  ctx.beginPath(); ctx.rect(-s*.06,-s*.78,s*.12,s*.1); ctx.fill();
}
export function drawSportif(s) {
  drawProfBase(s, '#E74C3C');
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(0,s*.0,s*.3,Math.PI*.85,Math.PI*.15); ctx.fill();
  ctx.fillStyle='#E74C3C'; ctx.font=`bold ${s*.18}px sans-serif`; ctx.textAlign='center';
  ctx.fillText('11',0,s*.08);
  ctx.fillStyle='#E74C3C';
  ctx.beginPath(); ctx.rect(-s*.3,-s*.74,s*.6,s*.32); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.rect(-s*.22,-s*.72,s*.44,s*.28); ctx.fill();
  ctx.fillStyle='#E74C3C';
  ctx.beginPath(); ctx.moveTo(-s*.22,-s*.72); ctx.lineTo(s*.22,-s*.72);
  ctx.moveTo(-s*.22,-s*.58); ctx.lineTo(s*.22,-s*.58); ctx.stroke();
}
export function drawProfesseur(s) {
  drawProfBase(s, '#2C3E50');
  ctx.fillStyle='#1A252F';
  ctx.beginPath(); ctx.rect(-s*.22,-s*.72,s*.44,s*.3); ctx.fill();
  ctx.fillStyle='black';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.28,s*.18,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3498DB';
  ctx.beginPath(); ctx.arc(-s*.28,-s*.78,s*.06,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#95A5A6'; ctx.lineWidth=s*.03;
  ctx.beginPath(); ctx.moveTo(s*.5,s*.1); ctx.lineTo(s*.5,-s*.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s*.4,-s*.55); ctx.lineTo(s*.5,-s*.6); ctx.lineTo(s*.6,-s*.55); ctx.stroke();
}
export function drawFacteur(s) {
  drawProfBase(s, '#FFD700');
  ctx.fillStyle='#CC8800';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.32,s*.2,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.rect(-s*.3,-s*.79,s*.6,s*.08); ctx.fill();
  ctx.fillStyle='#FFD700'; ctx.fillRect(-s*.28,-s*.79+s*.01,s*.56,s*.04);
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.rect(-s*.22,-s*.5,s*.44,s*.3); ctx.fill();
  ctx.strokeStyle='#CC8800'; ctx.lineWidth=s*.02;
  ctx.beginPath(); ctx.rect(-s*.22,-s*.5,s*.44,s*.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s*.22,-s*.5); ctx.lineTo(0,-s*.35); ctx.lineTo(s*.22,-s*.5); ctx.stroke();
}
export function drawSamourai(s) {
  drawProfBase(s, '#8B0000');
  ctx.fillStyle='#6A0000';
  ctx.beginPath(); ctx.rect(-s*.28,-s*.72,s*.56,s*.32); ctx.fill();
  ctx.fillStyle='#1A1A1A';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.36,s*.24,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.24,s*.36,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#8B0000';
  ctx.beginPath(); ctx.arc(0,-s*.94,s*.08,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#C0C0C0'; ctx.lineWidth=s*.03;
  ctx.beginPath(); ctx.moveTo(-s*.5,s*.1); ctx.lineTo(-s*.5,-s*.6); ctx.lineTo(-s*.44,-s*.65); ctx.stroke();
}
export function drawInfirmier(s) {
  drawProfBase(s, '#ECF0F1');
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.rect(-s*.28,-s*.72,s*.56,s*.32); ctx.fill();
  ctx.fillStyle='#E74C3C';
  ctx.beginPath(); ctx.rect(-s*.04,-s*.68,s*.08,s*.24); ctx.fill();
  ctx.beginPath(); ctx.rect(-s*.12,-s*.56,s*.24,s*.08); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.28,s*.18,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#BDC3C7'; ctx.lineWidth=s*.015;
  ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.28,s*.18,0,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#E74C3C';
  ctx.beginPath(); ctx.arc(0,-s*.78,s*.05,0,Math.PI*2); ctx.fill();
}

// ── Object drawing ────────────────────────────────────────────────────────────
export function drawObject(s, type) {
  switch(type.id) {
    case 'plume': {
      ctx.save(); ctx.rotate(-0.4);
      ctx.strokeStyle='#C8A8E8'; ctx.lineWidth=s*.18; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(0,s*.8); ctx.bezierCurveTo(-s*.2,s*.2,-s*.3,-s*.3,0,-s*.8); ctx.stroke();
      ctx.strokeStyle='rgba(200,180,240,0.5)'; ctx.lineWidth=s*.06;
      for(let i=-3;i<=3;i++){
        const t=i/3, py=t*s*.5, px=t*s*.22;
        ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px-s*.28*Math.abs(t),py-s*.14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+s*.28*Math.abs(t),py-s*.14); ctx.stroke();
      }
      ctx.restore(); break;
    }
    case 'souris': {
      ctx.fillStyle='#B0A09A';
      ctx.beginPath(); ctx.ellipse(0,s*.1,s*.45,s*.38,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(0,-s*.28,s*.3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#E8C8C8';
      ctx.beginPath(); ctx.arc(-s*.2,-s*.52,s*.14,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc( s*.2,-s*.52,s*.14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#2C2C2C';
      ctx.beginPath(); ctx.arc(-s*.1,-s*.28,s*.065,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc( s*.1,-s*.28,s*.065,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#888'; ctx.lineWidth=s*.06; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(s*.4,s*.28); ctx.bezierCurveTo(s*.7,s*.1,s*.7,-s*.3,s*.45,-s*.5); ctx.stroke();
      break;
    }
    case 'bombe': {
      const grad=ctx.createRadialGradient(-s*.1,-s*.1,s*.02,0,0,s*.45);
      grad.addColorStop(0,'#555'); grad.addColorStop(1,'#1a1a1a');
      ctx.fillStyle=grad;
      ctx.beginPath(); ctx.arc(0,0,s*.42,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#555'; ctx.lineWidth=s*.08;
      ctx.beginPath(); ctx.moveTo(s*.1,-s*.42); ctx.bezierCurveTo(s*.1,-s*.7,s*.3,-s*.7,s*.28,-s*.46); ctx.stroke();
      ctx.fillStyle='#FFD700';
      ctx.beginPath(); ctx.arc(s*.28,-s*.5,s*.06,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,200,100,0.9)';
      const t=Date.now()/400;
      ctx.beginPath(); ctx.arc(s*.28+Math.cos(t)*s*.04,-s*.5+Math.sin(t)*s*.06,s*.04,0,Math.PI*2); ctx.fill();
      break;
    }
  }
}


// ── Draw cat (with transform) ─────────────────────────────────────────────────
export function renderCat(cat) {
  const s = cat.size;
  ctx.save();
  ctx.translate(cat.x, cat.y);
  ctx.rotate(cat.rot);

  // Furtif: clignote (invincible quand invisible)
  if (cat.type.id === 'furtif' && !cat.caught) {
    ctx.globalAlpha = cat.visible ? 1 : 0.08;
  }
  if (cat.caught) {
    ctx.globalAlpha = Math.max(0, cat.catchAnim);
    ctx.scale(1 + (1-cat.catchAnim)*.6, 1 + (1-cat.catchAnim)*.6);
  }

  drawCatShape(s, cat.type, cat);


  // Bouclier — bulle de protection
  if ((cat.type.id === 'bouclier') && !cat.caught && cat.hp > 0) {
    const pulse = 0.35 + Math.sin(state.gameTime*4)*.08 + (cat.shieldFlash||0)*.4;
    ctx.strokeStyle = `rgba(80,180,255,${pulse})`;
    ctx.lineWidth = 3 + (cat.shieldFlash||0)*4;
    ctx.shadowColor = '#4FC3F7'; ctx.shadowBlur = 8 + (cat.shieldFlash||0)*20;
    ctx.beginPath(); ctx.arc(0, -s*.2, s*1.32, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
    // HP pip
    ctx.fillStyle = cat.hp >= 2 ? '#4FC3F7' : '#FF6B6B';
    ctx.beginPath(); ctx.arc(0, -s*1.55, s*.2, 0, Math.PI*2); ctx.fill();
  }

  // Boss — couronne + barre de vie
  if (cat.type.id === 'boss' && !cat.caught) {
    // Aura pulsante
    const aura = 0.12 + Math.sin(state.gameTime*3)*.06;
    ctx.shadowColor = '#C0392B'; ctx.shadowBlur = 30;
    ctx.strokeStyle = `rgba(192,57,43,${aura+.2})`;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -s*.2, s*1.15, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;

    // Couronne
    ctx.font = `${Math.round(s*.7)}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('👑', 0, -s*1.5);

    // Barre de vie
    const bw = s*2.8, bh = 10, bx = -bw/2, by = s*.9;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,4); ctx.fill();
    const pct = cat.hp / cat.maxHp;
    ctx.fillStyle = pct > .6 ? '#2ECC71' : pct > .3 ? '#F39C12' : '#E74C3C';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.roundRect(bx,by,bw*pct,bh,4); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,4); ctx.stroke();
  }

  // Lucky — étoile dorée scintillante
  if (cat.lucky && !cat.caught) {
    const sparkA = 0.6 + Math.sin(state.gameTime * 8 + cat.wobble) * 0.4;
    ctx.globalAlpha = sparkA;
    ctx.font = `${Math.round(s * 0.55)}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⭐', s * 0.65, -s * 0.9);
    ctx.globalAlpha = 1;
  }

  // Speech bubble
  if (cat.speech && !cat.caught) {
    const sp = cat.speech;
    sp.age += 0.016;
    const fade = sp.age > sp.dur - 0.5 ? Math.max(0, (sp.dur - sp.age) / 0.5) : Math.min(1, sp.age / 0.3);
    if (fade > 0) {
      ctx.save();
      ctx.globalAlpha = fade;
      const fs = Math.max(10, s * 0.42);
      ctx.font = `600 ${fs}px 'Fredoka',sans-serif`;
      const tw = ctx.measureText(sp.text).width;
      const pad = 6, bw = tw + pad*2, bh = fs + pad*1.4, br = 7;
      const bx = s * 0.3, by = -s * 1.6;
      // Bulle blanche
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, br); ctx.fill();
      ctx.strokeStyle = 'rgba(42,27,74,0.25)'; ctx.lineWidth = 1.2;
      ctx.stroke();
      // Petite pointe vers le chat
      ctx.beginPath();
      ctx.moveTo(bx + 10, by + bh);
      ctx.lineTo(bx + 4, by + bh + 6);
      ctx.lineTo(bx + 18, by + bh);
      ctx.fillStyle = '#fff'; ctx.fill();
      // Texte
      ctx.fillStyle = '#2a1b4a';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(sp.text, bx + pad, by + bh / 2);
      ctx.restore();
    }
  }

  ctx.restore();
}


export function darken(hex, f) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.floor(r*(1-f))},${Math.floor(g*(1-f))},${Math.floor(b*(1-f))})`;
}
export function drawSiamois(s) {
  // Corps crème clair, masque + extrémités chocolat, yeux bleus
  const cream='#F5ECD7', dark='#4A2C1A';
  ctx.fillStyle=cream;
  ctx.beginPath(); ctx.ellipse(0,s*.1,s*.56,s*.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-s*.355,s*.4,0,Math.PI*2); ctx.fill();
  // Masque foncé autour du museau
  ctx.fillStyle=dark;
  ctx.beginPath(); ctx.ellipse(0,-s*.27,s*.22,s*.18,0,0,Math.PI*2); ctx.fill();
  // Oreilles pointues foncées
  ctx.beginPath(); ctx.moveTo(-s*.36,-s*.62); ctx.lineTo(-s*.19,-s*.93); ctx.lineTo(-s*.02,-s*.65); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.02,-s*.65); ctx.lineTo( s*.19,-s*.93); ctx.lineTo( s*.36,-s*.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#FFB5C8';
  ctx.beginPath(); ctx.moveTo(-s*.28,-s*.67); ctx.lineTo(-s*.19,-s*.82); ctx.lineTo(-s*.10,-s*.68); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.10,-s*.68); ctx.lineTo( s*.19,-s*.82); ctx.lineTo( s*.28,-s*.67); ctx.closePath(); ctx.fill();
  // Yeux bleus caractéristiques
  ctx.fillStyle='#1B6CA8';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.375,s*.092,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.375,s*.092,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.ellipse(-s*.145,-s*.375,s*.05,s*.075,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.145,-s*.375,s*.05,s*.075,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(-s*.11,-s*.41,s*.026,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.17,-s*.41,s*.026,0,Math.PI*2); ctx.fill();
  // Nez + bouche
  ctx.fillStyle='#FF8FAB';
  ctx.beginPath(); ctx.moveTo(-s*.04,-s*.25); ctx.lineTo(s*.04,-s*.25); ctx.lineTo(0,-s*.22); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#555'; ctx.lineWidth=s*.022; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,-s*.22); ctx.quadraticCurveTo(-s*.1,-s*.16,-s*.13,-s*.17); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-s*.22); ctx.quadraticCurveTo( s*.1,-s*.16, s*.13,-s*.17); ctx.stroke();
  // Blush + moustaches
  ctx.fillStyle='rgba(255,127,179,0.4)';
  ctx.beginPath(); ctx.ellipse(-s*.29,-s*.19,s*.1,s*.06,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.29,-s*.19,s*.1,s*.06,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(120,120,120,0.4)'; ctx.lineWidth=1.0;
  [[-s*.055,-s*.26,-s*.36,-s*.31],[-s*.055,-s*.26,-s*.35,-s*.23],
   [ s*.055,-s*.26, s*.36,-s*.31],[ s*.055,-s*.26, s*.35,-s*.23]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  // Queue
  ctx.strokeStyle=dark; ctx.lineWidth=s*.13; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(s*.45,s*.2); ctx.quadraticCurveTo(s*.88,-s*.08,s*.56,-s*.62); ctx.stroke();
}
export function drawSphynx(s) {
  // Pas de fourrure — peau nude rose-brun, grandes oreilles, rides
  const skin='#C4956A', skinD='#A07040';
  ctx.fillStyle=skin;
  ctx.beginPath(); ctx.ellipse(0,s*.1,s*.54,s*.48,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-s*.35,s*.38,0,Math.PI*2); ctx.fill();
  // Grandes oreilles triangulaires très ouvertes
  ctx.fillStyle=skin;
  ctx.beginPath(); ctx.moveTo(-s*.42,-s*.58); ctx.lineTo(-s*.28,-s*.98); ctx.lineTo( s*.0,-s*.62); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.0,-s*.62); ctx.lineTo( s*.28,-s*.98); ctx.lineTo( s*.42,-s*.58); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#E8B4A0';
  ctx.beginPath(); ctx.moveTo(-s*.38,-s*.60); ctx.lineTo(-s*.26,-s*.9); ctx.lineTo(-s*.04,-s*.64); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.04,-s*.64); ctx.lineTo( s*.26,-s*.9); ctx.lineTo( s*.38,-s*.60); ctx.closePath(); ctx.fill();
  // Rides sur le front
  ctx.strokeStyle=skinD; ctx.lineWidth=s*.018; ctx.lineCap='round';
  for(let i=0;i<3;i++){
    ctx.beginPath(); ctx.moveTo(-s*.12,-s*.48+i*s*.06); ctx.quadraticCurveTo(0,-s*.52+i*s*.06,s*.12,-s*.48+i*s*.06); ctx.stroke();
  }
  // Grands yeux verts en amande
  ctx.fillStyle='#3DAA5C';
  ctx.beginPath(); ctx.ellipse(-s*.148,-s*.37,s*.1,s*.075,0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.148,-s*.37,s*.1,s*.075,-0.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.ellipse(-s*.148,-s*.37,s*.048,s*.072,0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.148,-s*.37,s*.048,s*.072,-0.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(-s*.11,-s*.4,s*.024,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.17,-s*.4,s*.024,0,Math.PI*2); ctx.fill();
  // Nez proéminent
  ctx.fillStyle='#E08070';
  ctx.beginPath(); ctx.ellipse(0,-s*.26,s*.06,s*.045,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#888'; ctx.lineWidth=s*.02; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,-s*.215); ctx.quadraticCurveTo(-s*.09,-s*.15,-s*.12,-s*.16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-s*.215); ctx.quadraticCurveTo( s*.09,-s*.15, s*.12,-s*.16); ctx.stroke();
  // Blush discret
  ctx.fillStyle='rgba(220,140,100,0.35)';
  ctx.beginPath(); ctx.ellipse(-s*.27,-s*.18,s*.1,s*.06,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.27,-s*.18,s*.1,s*.06,0,0,Math.PI*2); ctx.fill();
  // Queue fine
  ctx.strokeStyle=skinD; ctx.lineWidth=s*.07; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(s*.45,s*.2); ctx.quadraticCurveTo(s*.9,-s*.05,s*.6,-s*.55); ctx.stroke();
}
export function drawPersan(s) {
  // Face très plate, fourrure abondante, tête ronde, expression renfrognée
  const col='#E8DCC8', colD='#C8B898';
  // Corps très poilu — ellipse plus large
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.ellipse(0,s*.12,s*.64,s*.55,0,0,Math.PI*2); ctx.fill();
  // Fourrure — petits traits autour du corps
  ctx.strokeStyle=colD; ctx.lineWidth=s*.04; ctx.lineCap='round';
  for(let i=0;i<14;i++){
    const a=(i/14)*Math.PI*2;
    const r1=s*.58+Math.sin(i*1.7)*s*.04, r2=r1+s*.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*r1,s*.12+Math.sin(a)*r1*.85);
    ctx.lineTo(Math.cos(a)*r2,s*.12+Math.sin(a)*r2*.85);
    ctx.stroke();
  }
  // Tête très ronde
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.arc(0,-s*.33,s*.45,0,Math.PI*2); ctx.fill();
  // Oreilles petites, rondes, presque cachées
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.moveTo(-s*.34,-s*.64); ctx.lineTo(-s*.2,-s*.82); ctx.lineTo(-s*.04,-s*.66); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.04,-s*.66); ctx.lineTo( s*.2,-s*.82); ctx.lineTo( s*.34,-s*.64); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#FFB5C8';
  ctx.beginPath(); ctx.moveTo(-s*.28,-s*.67); ctx.lineTo(-s*.2,-s*.78); ctx.lineTo(-s*.1,-s*.68); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.1,-s*.68); ctx.lineTo( s*.2,-s*.78); ctx.lineTo( s*.28,-s*.67); ctx.closePath(); ctx.fill();
  // Face très plate — nez quasi absent, yeux proches
  ctx.fillStyle='#B5935A';
  ctx.beginPath(); ctx.arc(-s*.12,-s*.35,s*.088,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.12,-s*.35,s*.088,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.ellipse(-s*.12,-s*.35,s*.048,s*.076,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.12,-s*.35,s*.048,s*.076,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(-s*.09,-s*.38,s*.024,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.14,-s*.38,s*.024,0,Math.PI*2); ctx.fill();
  // Nez très court et plat
  ctx.fillStyle='#FF9BAB';
  ctx.beginPath(); ctx.ellipse(0,-s*.265,s*.04,s*.03,0,0,Math.PI*2); ctx.fill();
  // Bouche grognon (U inversé)
  ctx.strokeStyle='#888'; ctx.lineWidth=s*.022; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-s*.08,-s*.21); ctx.quadraticCurveTo(-s*.04,-s*.18,0,-s*.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( s*.08,-s*.21); ctx.quadraticCurveTo( s*.04,-s*.18,0,-s*.2); ctx.stroke();
  // Blush
  ctx.fillStyle='rgba(255,127,179,0.45)';
  ctx.beginPath(); ctx.ellipse(-s*.26,-s*.18,s*.11,s*.065,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.26,-s*.18,s*.11,s*.065,0,0,Math.PI*2); ctx.fill();
  // Queue touffue
  ctx.strokeStyle=colD; ctx.lineWidth=s*.18; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(s*.45,s*.2); ctx.quadraticCurveTo(s*.85,-s*.06,s*.55,-s*.58); ctx.stroke();
  ctx.strokeStyle=col; ctx.lineWidth=s*.1;
  ctx.beginPath(); ctx.moveTo(s*.45,s*.2); ctx.quadraticCurveTo(s*.85,-s*.06,s*.55,-s*.58); ctx.stroke();
}
export function drawScottish(s) {
  // Oreilles repliées vers l'avant — le trait distinctif
  const col='#B0A090', colD='#887060';
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.ellipse(0,s*.1,s*.56,s*.5,0,0,Math.PI*2); ctx.fill();
  if (true) { // stries douces
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0,s*.1,s*.56,s*.5,0,0,Math.PI*2); ctx.clip();
    ctx.strokeStyle=colD; ctx.lineWidth=s*.07; ctx.lineCap='round';
    for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*s*.2-s*.28,-s*.3);ctx.lineTo(i*s*.2+s*.1,s*.6);ctx.stroke();}
    ctx.restore();
  }
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.arc(0,-s*.355,s*.42,0,Math.PI*2); ctx.fill();
  // Oreilles repliées — demi-cercles aplatis vers le bas
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.ellipse(-s*.25,-s*.66,s*.18,s*.12,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.25,-s*.66,s*.18,s*.12, 0.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFB5C8';
  ctx.beginPath(); ctx.ellipse(-s*.25,-s*.64,s*.1,s*.07,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.25,-s*.64,s*.1,s*.07, 0.3,0,Math.PI*2); ctx.fill();
  // Yeux ronds et doux — expression calme
  ctx.fillStyle='#8B6914';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.375,s*.095,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.375,s*.095,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.375,s*.055,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.375,s*.055,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(-s*.108,-s*.41,s*.027,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.178,-s*.41,s*.027,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FF8FAB';
  ctx.beginPath(); ctx.moveTo(-s*.05,-s*.265); ctx.lineTo(s*.05,-s*.265); ctx.lineTo(0,-s*.23); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#666'; ctx.lineWidth=s*.022; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,-s*.23); ctx.quadraticCurveTo(-s*.1,-s*.16,-s*.13,-s*.175); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-s*.23); ctx.quadraticCurveTo( s*.1,-s*.16, s*.13,-s*.175); ctx.stroke();
  ctx.fillStyle='rgba(255,127,179,0.5)';
  ctx.beginPath(); ctx.ellipse(-s*.29,-s*.19,s*.11,s*.066,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.29,-s*.19,s*.11,s*.066,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(120,120,120,0.4)'; ctx.lineWidth=1.0;
  [[-s*.055,-s*.26,-s*.37,-s*.31],[-s*.055,-s*.26,-s*.36,-s*.23],
   [ s*.055,-s*.26, s*.37,-s*.31],[ s*.055,-s*.26, s*.36,-s*.23]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  ctx.strokeStyle=col; ctx.lineWidth=s*.135; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(s*.45,s*.2); ctx.quadraticCurveTo(s*.88,-s*.08,s*.56,-s*.62); ctx.stroke();
}
export function drawBengal(s) {
  // Pelage fauve avec taches leopard, museau clair, yeux verts
  const base='#C8843A', spot='#5A3010', light='#F0D090';
  ctx.fillStyle=base;
  ctx.beginPath(); ctx.ellipse(0,s*.1,s*.56,s*.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-s*.355,s*.4,0,Math.PI*2); ctx.fill();
  // Taches léopard sur le corps
  ctx.fillStyle=spot;
  const spots=[[-s*.22,s*.0,s*.1,s*.07],[ s*.25,s*.05,s*.09,s*.065],
               [-s*.08,s*.28,s*.12,s*.07],[ s*.18,s*.22,s*.1,s*.065],
               [-s*.35,s*.18,s*.08,s*.055],[ s*.0,s*.42,s*.09,s*.055]];
  spots.forEach(([x,y,rx,ry])=>{
    ctx.beginPath(); ctx.ellipse(x,y,rx,ry,Math.random()*.8,0,Math.PI*2); ctx.fill();
  });
  // Rosettes sur la tête
  ctx.fillStyle=spot;
  ctx.beginPath(); ctx.ellipse(-s*.08,-s*.52,s*.06,s*.04,0.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.08,-s*.52,s*.06,s*.04,-0.4,0,Math.PI*2); ctx.fill();
  // Oreilles pointues fauves
  ctx.fillStyle=base;
  ctx.beginPath(); ctx.moveTo(-s*.36,-s*.62); ctx.lineTo(-s*.19,-s*.93); ctx.lineTo(-s*.02,-s*.65); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.02,-s*.65); ctx.lineTo( s*.19,-s*.93); ctx.lineTo( s*.36,-s*.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#FFB5C8';
  ctx.beginPath(); ctx.moveTo(-s*.30,-s*.66); ctx.lineTo(-s*.20,-s*.84); ctx.lineTo(-s*.09,-s*.68); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.09,-s*.68); ctx.lineTo( s*.20,-s*.84); ctx.lineTo( s*.30,-s*.66); ctx.closePath(); ctx.fill();
  // Museau clair
  ctx.fillStyle=light;
  ctx.beginPath(); ctx.ellipse(0,-s*.24,s*.2,s*.14,0,0,Math.PI*2); ctx.fill();
  // Yeux verts intenses
  ctx.fillStyle='#2E8B3A';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.375,s*.092,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.375,s*.092,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.ellipse(-s*.145,-s*.375,s*.046,s*.075,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.145,-s*.375,s*.046,s*.075,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(-s*.108,-s*.41,s*.026,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.175,-s*.41,s*.026,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FF8FAB';
  ctx.beginPath(); ctx.moveTo(-s*.05,-s*.26); ctx.lineTo(s*.05,-s*.26); ctx.lineTo(0,-s*.225); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#555'; ctx.lineWidth=s*.022; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,-s*.225); ctx.quadraticCurveTo(-s*.1,-s*.155,-s*.14,-s*.175); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-s*.225); ctx.quadraticCurveTo( s*.1,-s*.155, s*.14,-s*.175); ctx.stroke();
  ctx.fillStyle='rgba(255,127,179,0.45)';
  ctx.beginPath(); ctx.ellipse(-s*.29,-s*.19,s*.11,s*.065,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.29,-s*.19,s*.11,s*.065,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(120,120,120,0.4)'; ctx.lineWidth=1.0;
  [[-s*.055,-s*.26,-s*.37,-s*.31],[-s*.055,-s*.26,-s*.36,-s*.23],
   [ s*.055,-s*.26, s*.37,-s*.31],[ s*.055,-s*.26, s*.36,-s*.23]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  ctx.strokeStyle=spot; ctx.lineWidth=s*.135; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(s*.45,s*.2); ctx.quadraticCurveTo(s*.88,-s*.08,s*.56,-s*.62); ctx.stroke();
}
export function drawCatShape(s, type, cat) {
  const col = type.col;
  // Sprite image override (multi-pose array)
  if (CAT_SPRITES[type.id]) {
    const poses = CAT_SPRITES[type.id];
    const idx = cat ? (cat.poseIdx || 0) : 0;
    const img = poses[Math.min(idx, poses.length - 1)];
    if (img && img.complete && img.naturalWidth > 0) {
      const scale = cat ? (cat.spriteScale || 1) : 1;
      const d = s * 3.2 * scale;
      ctx.save();
      if (cat) {
        const wobble = Math.sin(cat.wobble) * 0.09;
        ctx.rotate(cat.spriteRot + wobble);
        if (cat.spriteFlip) ctx.scale(-1, 1);
      }
      ctx.drawImage(img, -d/2, -d*0.55, d, d);
      ctx.restore();
      return;
    }
  }
  if (type.id === 'fantome') { drawGhost(s); return; }
  if (type.id === 'faux')    { drawDog(s);   return; }
  if (type.id === 'siamois') { drawSiamois(s); return; }
  if (type.id === 'sphynx')  { drawSphynx(s);  return; }
  if (type.id === 'persan')  { drawPersan(s);  return; }
  if (type.id === 'scottish'){ drawScottish(s); return; }
  if (type.id === 'bengal')  { drawBengal(s);  return; }
  if (type.id === 'pompier')  { drawPompier(s);  return; }
  if (type.id === 'boulanger'){ drawBoulanger(s); return; }
  if (type.id === 'ninja')    { drawNinja(s);    return; }
  if (type.id === 'detective'){ drawDetective(s); return; }
  if (type.id === 'pirate')   { drawPirate(s);   return; }
  if (type.id === 'policier') { drawPolicier(s); return; }
  if (type.id === 'magicien') { drawMagicien(s); return; }
  if (type.id === 'cowboy')   { drawCowboy(s);   return; }
  if (type.id === 'viking')   { drawViking(s);   return; }
  if (type.id === 'sorciere') { drawSorciere(s); return; }
  if (type.id === 'marin')    { drawMarin(s);    return; }
  if (type.id === 'gamer')    { drawGamer(s);    return; }
  if (type.id === 'scientifique') { drawScientifique(s); return; }
  if (type.id === 'artiste')  { drawArtiste(s);  return; }
  if (type.id === 'jardinier'){ drawJardinier(s);return; }
  if (type.id === 'chevalier'){ drawChevalier(s);return; }
  if (type.id === 'musicien') { drawMusicien(s); return; }
  if (type.id === 'cuisinier'){ drawCuisinier(s);return; }
  if (type.id === 'clown')    { drawClown(s);    return; }
  if (type.id === 'robot')    { drawRobot(s);    return; }
  if (type.id === 'sportif')  { drawSportif(s);  return; }
  if (type.id === 'professeur'){ drawProfesseur(s);return; }
  if (type.id === 'facteur')  { drawFacteur(s);  return; }
  if (type.id === 'samourai') { drawSamourai(s); return; }
  if (type.id === 'infirmier'){ drawInfirmier(s);return; }
  if (type.isObject) {
    const _oSpr = typeof OBJECT_SPRITES !== 'undefined' && OBJECT_SPRITES[type.id];
    if (_oSpr && _oSpr.complete && _oSpr.naturalWidth > 0) {
      const d = s * 3.2;
      ctx.drawImage(_oSpr, -d/2, -d/2, d, d);
      return;
    }
    drawObject(s, type); return;
  }
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(0,s*.1,s*.56,s*.5,0,0,Math.PI*2); ctx.fill();
  if (type.stripes) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0,s*.1,s*.56,s*.5,0,0,Math.PI*2); ctx.clip();
    ctx.strokeStyle=darken(col,0.22); ctx.lineWidth=s*.09; ctx.lineCap='round';
    for (let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*s*.22-s*.3,-s*.32);ctx.lineTo(i*s*.22+s*.12,s*.62);ctx.stroke();}
    ctx.restore();
  }
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.arc(0,-s*.355,s*.4,0,Math.PI*2); ctx.fill();
  // ears
  ctx.beginPath(); ctx.moveTo(-s*.36,-s*.62); ctx.lineTo(-s*.19,-s*.93); ctx.lineTo(-s*.02,-s*.65); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.02,-s*.65); ctx.lineTo( s*.19,-s*.93); ctx.lineTo( s*.36,-s*.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#FFB5C8';
  ctx.beginPath(); ctx.moveTo(-s*.30,-s*.65); ctx.lineTo(-s*.20,-s*.84); ctx.lineTo(-s*.09,-s*.67); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( s*.09,-s*.67); ctx.lineTo( s*.20,-s*.84); ctx.lineTo( s*.30,-s*.65); ctx.closePath(); ctx.fill();
  if (type.id==='astro') {
    ctx.strokeStyle='rgba(200,235,255,0.65)'; ctx.lineWidth=s*.11;
    ctx.fillStyle='rgba(180,225,255,0.12)';
    ctx.beginPath(); ctx.arc(0,-s*.355,s*.57,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.9)';
    for(let i=0;i<4;i++){const a=(i/4)*Math.PI*2+state.gameTime;ctx.beginPath();ctx.arc(Math.cos(a)*s*.38,-s*.355+Math.sin(a)*s*.3,s*.025,0,Math.PI*2);ctx.fill();}
  }
  if (type.id==='rainbow') {
    const sc=['#FF6B6B','#FFD93D','#6BCB77','#4ECDC4','#C77DFF'];
    sc.forEach((c,i)=>{const a=state.gameTime*1.8+i*72*Math.PI/180;ctx.fillStyle=c;ctx.beginPath();ctx.arc(Math.cos(a)*s*.78,-s*.35+Math.sin(a)*s*.55,s*.06,0,Math.PI*2);ctx.fill();});
    const rg=ctx.createLinearGradient(-s*.56,0,s*.56,0);
    ['rgba(255,107,107,0.55)','rgba(255,217,61,0.55)','rgba(107,203,119,0.55)','rgba(78,205,196,0.55)','rgba(199,125,255,0.55)'].forEach((c,i,a)=>rg.addColorStop(i/(a.length-1),c));
    ctx.fillStyle=rg;
    ctx.beginPath(); ctx.ellipse(0,s*.1,s*.56,s*.5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0,-s*.355,s*.4,0,Math.PI*2); ctx.fill();
  }
  const isNoir=type.id==='noir';
  // face
  ctx.fillStyle=isNoir?'#FFD700':'#2C3E50';
  ctx.beginPath(); ctx.arc(-s*.145,-s*.375,s*.092,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.145,-s*.375,s*.092,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=isNoir?'rgba(0,0,0,0.6)':'#111';
  ctx.beginPath(); ctx.ellipse(-s*.145,-s*.375,s*.052,s*.078,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.145,-s*.375,s*.052,s*.078,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(-s*.105,-s*.412,s*.028,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*.175,-s*.412,s*.028,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FF8FAB';
  ctx.beginPath(); ctx.moveTo(-s*.055,-s*.268); ctx.lineTo(s*.055,-s*.268); ctx.lineTo(0,-s*.228); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#666'; ctx.lineWidth=s*.024; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,-s*.228); ctx.quadraticCurveTo(-s*.1,-s*.155,-s*.14,-s*.18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-s*.228); ctx.quadraticCurveTo( s*.1,-s*.155, s*.14,-s*.18); ctx.stroke();
  // kawaii blush cheeks
  ctx.fillStyle='rgba(255,127,179,0.52)';
  ctx.beginPath(); ctx.ellipse(-s*.29,-s*.19,s*.12,s*.07,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*.29,-s*.19,s*.12,s*.07,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(120,120,120,0.42)'; ctx.lineWidth=1.1;
  [[-s*.055,-s*.26,-s*.38,-s*.32],[-s*.055,-s*.26,-s*.37,-s*.24],
   [ s*.055,-s*.26, s*.38,-s*.32],[ s*.055,-s*.26, s*.37,-s*.24]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  ctx.strokeStyle=col; ctx.lineWidth=s*.135; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(s*.45,s*.2); ctx.quadraticCurveTo(s*.88,-s*.08,s*.56,-s*.62); ctx.stroke();

  // Médecin overlay — white cross
  if (type.id==='medecin') {
    ctx.fillStyle='rgba(255,255,255,0.92)';
    ctx.fillRect(-s*.06,-s*.62,s*.12,s*.34);
    ctx.fillRect(-s*.18,-s*.54,s*.36,s*.12);
    ctx.fillStyle='rgba(39,174,96,0.5)';
    ctx.beginPath(); ctx.arc(0,-s*.355,s*.62,0,Math.PI*2); ctx.fill();
  }
  // Griffeur overlay — angry eyes slash
  if (type.id==='griffeur') {
    ctx.strokeStyle='rgba(255,80,0,0.75)'; ctx.lineWidth=s*.04;
    ctx.beginPath(); ctx.moveTo(-s*.22,-s*.44); ctx.lineTo(-s*.08,-s*.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( s*.22,-s*.44); ctx.lineTo( s*.08,-s*.3); ctx.stroke();
    // Speed lines
    ctx.strokeStyle='rgba(255,100,0,0.3)'; ctx.lineWidth=s*.025;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-s*.7+i*s*.15,s*.1+i*s*.1);ctx.lineTo(-s*.95+i*s*.15,s*.1+i*s*.1);ctx.stroke();}
  }
}
export function drawProjIcon(id, cx, cy, size, targetCtx) {
  const ctx = targetCtx || window._gameCtx;
  const r = size;
  ctx.save();
  const wSprite = typeof WEAPON_SPRITES !== 'undefined' && WEAPON_SPRITES[id];
  if (wSprite && wSprite.complete && wSprite.naturalWidth > 0) {
    const d = r * 2.0;
    ctx.drawImage(wSprite, cx - d / 2, cy - d / 2, d, d);
    ctx.restore();
    return;
  }
  switch (id) {
    case 'pelote': {
      const grd = ctx.createRadialGradient(cx-r*.3, cy-r*.3, r*.05, cx, cy, r);
      grd.addColorStop(0,'#ffb87a'); grd.addColorStop(1,'#c84e1a');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=r*.11; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(cx-r*.68,cy-r*.14); ctx.quadraticCurveTo(cx-r*.1,cy-r*.82,cx+r*.42,cy-r*.18); ctx.quadraticCurveTo(cx+r*.84,cy+r*.22,cx+r*.28,cy+r*.68); ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,.14)'; ctx.lineWidth=r*.09;
      ctx.beginPath(); ctx.moveTo(cx+r*.18,cy-r*.78); ctx.quadraticCurveTo(cx-r*.48,cy,cx+r*.08,cy+r*.72); ctx.stroke();
      ctx.strokeStyle='#c84e1a'; ctx.lineWidth=r*.17;
      ctx.beginPath(); ctx.moveTo(cx+r*.52,cy+r*.52); ctx.lineTo(cx+r*.9,cy+r*.94); ctx.stroke();
      break;
    }
    case 'artifice': {
      ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=r*.12; ctx.lineCap='round';
      for (let i=0;i<8;i++) {
        const a=(i/8)*Math.PI*2;
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r*.42,cy+Math.sin(a)*r*.42); ctx.lineTo(cx+Math.cos(a)*r*.9,cy+Math.sin(a)*r*.9); ctx.stroke();
      }
      const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,r*.42);
      grd.addColorStop(0,'#fff'); grd.addColorStop(1,'#ffce3a');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,cy,r*.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(cx,cy,r*.13,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'laser': {
      const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      grd.addColorStop(0,'#fff'); grd.addColorStop(.35,'#ff3b3b'); grd.addColorStop(1,'#7a0010');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,r*.22,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=r*.14; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(cx-r*1.32,cy); ctx.lineTo(cx-r*.68,cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+r*.68,cy); ctx.lineTo(cx+r*1.32,cy); ctx.stroke();
      break;
    }
    case 'carton': {
      const s=r*.82;
      ctx.fillStyle='#d4a878'; ctx.strokeStyle='#8a5a2a'; ctx.lineWidth=r*.06;
      ctx.beginPath(); ctx.moveTo(cx,cy-s); ctx.lineTo(cx+s*.84,cy-s*.44); ctx.lineTo(cx,cy); ctx.lineTo(cx-s*.84,cy-s*.44); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#a87a4a';
      ctx.beginPath(); ctx.moveTo(cx-s*.84,cy-s*.44); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+s*.65); ctx.lineTo(cx-s*.84,cy+s*.21); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#c89a6a';
      ctx.beginPath(); ctx.moveTo(cx+s*.84,cy-s*.44); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+s*.65); ctx.lineTo(cx+s*.84,cy+s*.21); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font=`${Math.round(r*.55)}px Arial`; ctx.fillStyle='rgba(255,255,255,.75)'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('★',cx+s*.38,cy+s*.22);
      break;
    }
  }
  ctx.restore();
}
