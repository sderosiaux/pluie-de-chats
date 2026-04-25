// @ts-nocheck
import { state, caughtTypes } from './state';
import { CAT_TYPES, CAT_LABELS, CAT_CATEGORIES, CAT_CATCOLS } from './data';
import { CAT_SPRITES } from './sprites';

// ── Bestiary ──────────────────────────────────────────────────────────────────
/* extracted to module */
/* extracted to module */
/* extracted to module */
let caughtTypes; try { caughtTypes = new Set(JSON.parse(localStorage.getItem('pdc_caught')||'[]')); } catch { caughtTypes = new Set(); }

export function markCaught(typeId) {
  if (caughtTypes.has(typeId)) return;
  caughtTypes.add(typeId);
  localStorage.setItem('pdc_caught', JSON.stringify([...caughtTypes]));
}

export function drawCatPreview(cvs, type, caught) {
  const tc = cvs.getContext('2d');
  const w = cvs.width, h = cvs.height;
  tc.clearRect(0,0,w,h);
  // Use PNG sprite if available
  const spriteArr = CAT_SPRITES[type.id];
  const sprite = spriteArr ? spriteArr[0] : null;
  if (caught && sprite && sprite.complete && sprite.naturalWidth > 0) {
    tc.drawImage(sprite, 0, 0, w, h);
    return;
  }
  if (!caught) {
    tc.fillStyle='rgba(0,0,0,0.45)';
    tc.beginPath(); tc.arc(w/2,h/2,w*.42,0,Math.PI*2); tc.fill();
    tc.fillStyle='rgba(255,255,255,0.25)';
    tc.font=`bold ${Math.round(w*.32)}px Arial`;
    tc.textAlign='center'; tc.textBaseline='middle';
    tc.fillText('?',w/2,h/2); return;
  }
  const cx=w/2, cy=h/2, s=w*.38;
  const col = type.col==='rainbow'?'#ff69b4': type.col;
  // Ears
  tc.fillStyle=col;
  [[-1],[1]].forEach(([dx])=>{
    tc.beginPath();
    tc.moveTo(cx+dx*s*.28, cy-s*.45);
    tc.lineTo(cx+dx*s*.72, cy-s*1.05);
    tc.lineTo(cx+dx*s*.76, cy-s*.38);
    tc.fill();
    tc.fillStyle='rgba(255,200,200,0.35)';
    tc.beginPath();
    tc.moveTo(cx+dx*s*.3,  cy-s*.5);
    tc.lineTo(cx+dx*s*.62, cy-s*.93);
    tc.lineTo(cx+dx*s*.65, cy-s*.44);
    tc.fill();
    tc.fillStyle=col;
  });
  // Head
  tc.beginPath(); tc.arc(cx,cy,s*.7,0,Math.PI*2);
  tc.fillStyle=col; tc.fill();
  // Stripes
  if (type.stripes) {
    tc.strokeStyle='rgba(0,0,0,0.16)'; tc.lineWidth=s*.14;
    for(let i=-1;i<=1;i++){
      tc.beginPath(); tc.moveTo(cx+i*s*.28,cy-s*.58); tc.lineTo(cx+i*s*.22,cy-s*.1); tc.stroke();
    }
  }
  // Eyes
  const eyeCol = type.id==='siamois'?'#1a6ee8': type.id==='sphynx'?'#dba520':'#fff';
  [-1,1].forEach(dx=>{
    tc.fillStyle=eyeCol;
    tc.beginPath(); tc.ellipse(cx+dx*s*.3,cy-s*.1,s*.15,s*.2,0,0,Math.PI*2); tc.fill();
    tc.fillStyle='#111';
    tc.beginPath(); tc.arc(cx+dx*s*.3,cy-s*.1,s*.09,0,Math.PI*2); tc.fill();
    tc.fillStyle='rgba(255,255,255,0.85)';
    tc.beginPath(); tc.arc(cx+dx*s*.3-s*.05,cy-s*.16,s*.035,0,Math.PI*2); tc.fill();
  });
  // Nose
  tc.fillStyle='#ff9eb5';
  tc.beginPath(); tc.moveTo(cx,cy+s*.12);
  tc.lineTo(cx-s*.07,cy+s*.22); tc.lineTo(cx+s*.07,cy+s*.22); tc.fill();
  // Whiskers
  tc.strokeStyle='rgba(255,255,255,0.5)'; tc.lineWidth=s*.04;
  [-1,1].forEach(dx=>{
    tc.beginPath(); tc.moveTo(cx+dx*s*.15,cy+s*.2); tc.lineTo(cx+dx*s*.95,cy+s*.14); tc.stroke();
    tc.beginPath(); tc.moveTo(cx+dx*s*.15,cy+s*.25); tc.lineTo(cx+dx*s*.9,cy+s*.36); tc.stroke();
  });
  if(type.id==='fantome'){tc.globalAlpha=.38;tc.fillStyle='#fff';tc.beginPath();tc.arc(cx,cy,s*.7,0,Math.PI*2);tc.fill();tc.globalAlpha=1;}
  if(type.id==='rainbow'){const rg=tc.createLinearGradient(cx-s,cy,cx+s,cy);['#f00','#ff0','#0f0','#00f','#f0f'].forEach((c,i,a)=>rg.addColorStop(i/(a.length-1),c));tc.globalAlpha=.3;tc.fillStyle=rg;tc.beginPath();tc.arc(cx,cy,s*.7,0,Math.PI*2);tc.fill();tc.globalAlpha=1;}
}

export function buildBestiary() {
  const grid = document.getElementById('bst-grid');
  grid.innerHTML='';
  const found=CAT_TYPES.filter(t=>caughtTypes.has(t.id)).length;
  document.getElementById('bst-count').textContent=`${found} / ${CAT_TYPES.length} découverts`;
  CAT_TYPES.forEach(type=>{
    const caught=caughtTypes.has(type.id);
    const label=type.label||CAT_LABELS[type.id]||type.id;
    const cat=CAT_CATEGORIES[type.id]||'Spécial';
    const catCol=CAT_CATCOLS[cat]||'#888';
    const card=document.createElement('div');
    card.className='bst-card'+(caught?'':' unknown');
    const badge=document.createElement('div');
    badge.className='bst-badge';
    badge.style.background=catCol;
    badge.textContent=caught?cat:'???';
    const cvs=document.createElement('canvas');
    cvs.width=72;cvs.height=72;
    cvs.style.cssText='margin:2px 0';
    drawCatPreview(cvs,type,caught);
    const name=document.createElement('div');
    name.className='bst-name';
    name.textContent=caught?label:'???';
    const pts=document.createElement('div');
    pts.className='bst-pts';
    if(caught) pts.textContent=type.pts>0?`+${type.pts} pts`:`${type.pts} pts`;
    card.append(badge,cvs,name,pts);
    if(caught&&type.hint){const hint=document.createElement('div');hint.className='bst-hint';hint.textContent=type.hint;card.append(hint);}
    if (caught) { card.style.cursor='pointer'; card.addEventListener('click', () => openBestiaryDetail(type)); }
    grid.appendChild(card);
  });
}

export function openBestiaryDetail(type) {
  const overlay = document.getElementById('bst-detail-overlay');
  const label = type.label || CAT_LABELS[type.id] || type.id;
  const cat = CAT_CATEGORIES[type.id] || 'Spécial';
  const catCol = CAT_CATCOLS[cat] || '#888';
  document.getElementById('bst-detail-name').textContent = label;
  const badge = document.getElementById('bst-detail-badge');
  badge.textContent = cat; badge.style.background = catCol;
  document.getElementById('bst-detail-pts').textContent = (type.pts > 0 ? '+' : '') + type.pts + ' pts';
  document.getElementById('bst-detail-hint').textContent = type.hint || '';
  // 3 poses (sit, mid, tro) centrées sans label
  const posesEl = document.getElementById('bst-detail-poses');
  posesEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'bst-pose';
    const cvs = document.createElement('canvas');
    cvs.width = 160; cvs.height = 160;
    const tc = cvs.getContext('2d');
    const sprite = CAT_SPRITES[type.id] && CAT_SPRITES[type.id][i];
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      tc.drawImage(sprite, 0, 0, 160, 160);
    } else {
      drawCatPreview(cvs, type, true);
    }
    wrap.appendChild(cvs);
    posesEl.appendChild(wrap);
  }
  overlay.classList.add('show');
}

