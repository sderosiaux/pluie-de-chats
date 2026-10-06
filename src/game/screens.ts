// Écrans hors jeu (GAME_SPEC §21) : carte des averses et carnet. DOM pur, construit à partir de la
// progression ; aucun accès à la simulation. Tout texte passe par textContent (les noms de costumes
// viennent du stockage local, déjà filtrés par progress.ts).

import { CHARACTERS } from '../sim';
import type { CharacterId } from '../sim';
import { AVERSES_PER_CHAPTER, CHAPTERS, CHARACTER_ORDER } from '../sim/averses/generator';
import { RARE_TIGRE_COSTUMES, costumesFor } from '../sim/costumes';
import { costumeUrl, sceneFor, sceneUrl } from './assets';
import { averseFor, isGrande, isUnlocked, slotId, suggestedSlot } from './campaign';
import type { Slot } from './campaign';
import { el } from './hud';
import { COLLARS, RAINBOW } from './look';
import { isNew, starsOf } from './progress';
import type { Progress } from './progress';

export interface ScreenHandlers {
  onPlay(averseId: string): void;
  onResume(): void;
  onOpenCarnet(): void;
  onCloseCarnet(): void;
  onSound(on: boolean): void;
  onReadPage(ch: CharacterId): void;
}

export interface Paused {
  id: string;
  label: string;
}

export interface Screens {
  showMap(p: Progress, paused: Paused | null): void;
  showCarnet(p: Progress): void;
  /** Rafraîchit le carnet ouvert (badge « nouveau » après lecture d'une page). */
  refreshCarnet(p: Progress): void;
  hide(): void;
}

type TileState = 'done' | 'open' | 'locked' | 'soon';

/** Nom affiché d'un chapitre : le caractère qu'il introduit, jamais sa règle (§10, §13). */
export function chapterName(chapter: number): string {
  return CHARACTERS[CHARACTER_ORDER[chapter - 1]].label;
}

export function averseLabel(s: Slot): string {
  return isGrande(s) ? `Grande averse ${slotId(s)}` : `Averse ${slotId(s)}`;
}

function make<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function sprite(costume: string, alt = ''): HTMLImageElement {
  const img = make('img');
  img.src = costumeUrl(costume, 'sit');
  img.alt = alt;
  img.decoding = 'async';
  img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
  return img;
}

function pawsRow(stars: number): HTMLSpanElement {
  const row = make('span', 'averse-paws');
  for (let i = 0; i < 3; i++) row.append(make('i', i < stars ? 'on' : '', '🐾'));
  return row;
}

function collarBadge(ch: CharacterId, big = false, target?: HTMLElement): HTMLElement | null {
  const look = COLLARS[ch];
  const badge = target ?? make('span');
  badge.className = big ? 'collar big' : 'collar';
  if (!look) {
    badge.hidden = true; // le tigré n'a pas de collier (§8)
    return target ? badge : null;
  }
  badge.hidden = false;
  badge.style.setProperty('--collar', look.color === 'rainbow' ? `conic-gradient(${RAINBOW.join(', ')}, ${RAINBOW[0]})` : look.color);
  badge.textContent = look.icon === 'dot' ? '' : look.icon;
  badge.setAttribute('aria-hidden', 'true');
  return badge;
}

const chapterOf = (ch: CharacterId): number => CHARACTER_ORDER.indexOf(ch) + 1;

/** Costume de présentation : le premier vu, sinon le premier du caractère. */
function coverCostume(p: Progress, ch: CharacterId): string {
  return p.costumes[ch]?.[0] ?? costumesFor(ch, chapterOf(ch))[0];
}

function ruleText(ch: CharacterId): string {
  // Le tigré n'a pas de règle propre : c'est le chat de référence (§8).
  return CHARACTERS[ch].rule || 'le chat de référence';
}

export function bindScreens(h: ScreenHandlers): Screens {
  const map = el<HTMLElement>('map');
  const chapters = el<HTMLOListElement>('chapters');
  const cta = el<HTMLDivElement>('map-cta');
  const ctaText = el<HTMLParagraphElement>('map-cta-text');
  const ctaGo = el<HTMLButtonElement>('map-cta-go');
  const sound = el<HTMLButtonElement>('sound');
  const openCarnet = el<HTMLButtonElement>('open-carnet');
  const carnetDot = el<HTMLSpanElement>('carnet-dot');

  const carnet = el<HTMLElement>('carnet');
  const carnetBack = el<HTMLButtonElement>('carnet-back');
  const carnetCount = el<HTMLSpanElement>('carnet-count');
  const carnetEmpty = el<HTMLDivElement>('carnet-empty');
  const grid = el<HTMLDivElement>('carnet-grid');

  const page = el<HTMLDivElement>('page');
  const pageImg = el<HTMLImageElement>('page-img');
  const pageCollar = el<HTMLSpanElement>('page-collar');
  const pageNum = el<HTMLSpanElement>('page-num');
  const pageName = el<HTMLHeadingElement>('page-name');
  const pageRule = el<HTMLParagraphElement>('page-rule');
  const pageCostumes = el<HTMLDivElement>('page-costumes');
  const pagePrev = el<HTMLButtonElement>('page-prev');
  const pageNext = el<HTMLButtonElement>('page-next');
  const pagePos = el<HTMLSpanElement>('page-pos');
  const pageClose = el<HTMLButtonElement>('page-close');

  let ctaAction: () => void = () => undefined;
  let soundOn = true;
  let progress: Progress | null = null;
  let pageChar: CharacterId | null = null;
  let firstMap = true;

  ctaGo.addEventListener('click', () => ctaAction());
  sound.addEventListener('click', () => h.onSound(!soundOn));
  openCarnet.addEventListener('click', () => h.onOpenCarnet());
  carnetBack.addEventListener('click', () => h.onCloseCarnet());
  pageClose.addEventListener('click', closePage);
  page.addEventListener('click', e => { if (e.target === page) closePage(); });
  pagePrev.addEventListener('click', () => flip(-1));
  pageNext.addEventListener('click', () => flip(1));
  chapters.addEventListener('click', e => {
    const tile = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-averse]');
    if (tile && !tile.disabled) h.onPlay(tile.dataset.averse as string);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!page.hidden) closePage();
    else if (!carnet.hidden) h.onCloseCarnet();
  });

  // ── Carte ──────────────────────────────────────────────────────────────

  function tile(p: Progress, s: Slot, suggested: Slot | null): HTMLButtonElement {
    const id = slotId(s);
    const def = averseFor(s);
    const stars = starsOf(p, id);
    const state: TileState = !def ? 'soon' : !isUnlocked(p, s) ? 'locked' : stars > 0 ? 'done' : 'open';
    const b = make('button', isGrande(s) ? 'averse grande' : 'averse');
    b.type = 'button';
    b.dataset.averse = id;
    b.dataset.state = state;
    b.disabled = state === 'locked' || state === 'soon';
    if (suggested && slotId(suggested) === id) b.classList.add('suggested');
    b.append(make('span', 'averse-num', String(s.index)));
    if (isGrande(s)) {
      const label = make('span', 'grande-label', 'Grande averse');
      if (def) label.append(make('small', '', `${def.spawns.length} chats`));
      b.append(label);
    }
    if (state === 'locked') b.append(make('span', 'averse-lock', '🔒'));
    else if (state === 'soon') b.append(make('span', 'soon-tag', 'bientôt'));
    else b.append(pawsRow(stars));
    const what = averseLabel(s);
    b.setAttribute('aria-label',
      state === 'soon' ? `${what}, bientôt` :
      state === 'locked' ? `${what}, verrouillée` :
      `${what}, ${stars} patte${stars > 1 ? 's' : ''} sur 3`);
    return b;
  }

  function chapterCard(p: Progress, chapter: number, suggested: Slot | null): HTMLLIElement {
    const slots: Slot[] = Array.from({ length: AVERSES_PER_CHAPTER }, (_, i) => ({ chapter, index: i + 1 }));
    const soon = slots.every(s => !averseFor(s));
    const locked = !soon && !isUnlocked(p, slots[0]);
    const li = make('li', 'chapter');
    li.dataset.chapter = String(chapter);
    li.dataset.state = soon ? 'soon' : locked ? 'locked' : 'open';

    const head = make('div', 'chapter-head');
    head.style.setProperty('--scene', `url("${sceneUrl(sceneFor(chapter))}")`);
    const title = make('div', 'chapter-title');
    title.append(make('span', 'chapter-num', `Chapitre ${chapter}`), make('h2', 'chapter-name', chapterName(chapter)));
    const total = slots.reduce((n, s) => n + starsOf(p, slotId(s)), 0);
    head.append(title, make('span', 'chapter-meta', soon ? 'bientôt' : locked ? '🔒' : `${total}/${3 * AVERSES_PER_CHAPTER} 🐾`));
    li.append(head);

    const row = make('div', 'averses');
    for (const s of slots) row.append(tile(p, s, suggested));
    li.append(row);
    if (soon) li.append(make('p', 'chapter-hint', 'Ces averses arrivent bientôt.'));
    else if (locked) li.append(make('p', 'chapter-hint', `Une 🐾 sur la Grande averse ${chapter - 1}-${AVERSES_PER_CHAPTER} ouvre ce chapitre.`));
    return li;
  }

  function renderMap(p: Progress, paused: Paused | null): Slot | null {
    const suggested = suggestedSlot(p);
    chapters.replaceChildren(...Array.from({ length: CHAPTERS }, (_, i) => chapterCard(p, i + 1, suggested)));

    const anyPaw = Object.values(p.averses).some(b => b.stars > 0);
    cta.hidden = false;
    if (paused) {
      ctaText.replaceChildren(make('b', '', 'En pause'), document.createTextNode(paused.label));
      ctaGo.textContent = 'Reprendre';
      ctaAction = () => h.onResume();
    } else if (!anyPaw && suggested) {
      ctaText.replaceChildren(make('b', '', 'Commence par la première averse'), document.createTextNode('Touche un chat : il percute ses voisins.'));
      ctaGo.textContent = `Jouer ${slotId(suggested)}`;
      ctaAction = () => h.onPlay(slotId(suggested));
    } else if (suggested) {
      ctaText.replaceChildren(make('b', '', 'Prochaine averse'), document.createTextNode(`${averseLabel(suggested)} · ${chapterName(suggested.chapter)}`));
      ctaGo.textContent = `Jouer ${slotId(suggested)}`;
      ctaAction = () => h.onPlay(slotId(suggested));
    } else {
      cta.hidden = true;
      ctaAction = () => undefined;
    }

    soundOn = p.sound;
    sound.textContent = p.sound ? '🔊' : '🔇';
    sound.setAttribute('aria-pressed', String(p.sound));
    sound.setAttribute('aria-label', p.sound ? 'Couper le son' : 'Activer le son');
    carnetDot.hidden = !CHARACTER_ORDER.some(ch => isNew(p, ch));
    return suggested;
  }

  // ── Carnet ─────────────────────────────────────────────────────────────

  function entry(p: Progress, ch: CharacterId): HTMLElement {
    const chapter = chapterOf(ch);
    if (!p.met.includes(ch)) {
      const card = make('div', 'entry unknown');
      card.dataset.char = ch;
      card.dataset.state = 'unknown';
      card.setAttribute('aria-label', `Caractère inconnu, chapitre ${chapter}`);
      const pic = make('div', 'entry-sprite');
      pic.append(sprite(costumesFor(ch, chapter)[0]), make('span', 'entry-q', '?'));
      card.append(pic, make('span', 'entry-rule', `Chapitre ${chapter}`));
      return card;
    }
    const card = make('button', 'entry');
    card.type = 'button';
    card.dataset.char = ch;
    card.dataset.state = 'met';
    const pic = make('div', 'entry-sprite');
    pic.append(sprite(coverCostume(p, ch)));
    const badge = collarBadge(ch);
    if (badge) pic.append(badge);
    card.append(pic, make('span', 'entry-name', CHARACTERS[ch].label), make('span', 'entry-rule', ruleText(ch)));
    if (isNew(p, ch)) card.append(make('span', 'new-tag', 'nouveau'));
    card.addEventListener('click', () => openPage(ch));
    return card;
  }

  function renderCarnet(p: Progress): void {
    progress = p;
    carnetCount.textContent = `${p.met.length}/${CHARACTER_ORDER.length}`;
    carnetEmpty.hidden = p.met.length > 0;
    grid.replaceChildren(...CHARACTER_ORDER.map(ch => entry(p, ch)));
  }

  const metInOrder = (p: Progress): CharacterId[] => CHARACTER_ORDER.filter(ch => p.met.includes(ch));

  function openPage(ch: CharacterId): void {
    if (!progress) return;
    const p = progress;
    pageChar = ch;
    pageImg.src = costumeUrl(coverCostume(p, ch), 'sit');
    collarBadge(ch, true, pageCollar);
    pageNum.textContent = `Chapitre ${chapterOf(ch)}`;
    pageName.textContent = CHARACTERS[ch].label;
    pageRule.textContent = ruleText(ch);
    const seen = p.costumes[ch] ?? [];
    pageCostumes.replaceChildren(...seen.map(c => {
      const box = make('div', RARE_TIGRE_COSTUMES.includes(c) ? 'costume rare' : 'costume');
      box.title = c;
      box.append(sprite(c, c));
      return box;
    }));
    const met = metInOrder(p);
    const i = met.indexOf(ch);
    pagePrev.disabled = i <= 0;
    pageNext.disabled = i >= met.length - 1;
    pagePos.textContent = `${i + 1} / ${met.length}`;
    page.hidden = false;
    pageClose.focus({ preventScroll: true });
    h.onReadPage(ch);
  }

  function flip(d: number): void {
    if (!progress || !pageChar) return;
    const met = metInOrder(progress);
    const next = met[met.indexOf(pageChar) + d];
    if (next) openPage(next);
  }

  function closePage(): void {
    page.hidden = true;
    pageChar = null;
  }

  return {
    showMap(p, paused) {
      closePage();
      carnet.hidden = true;
      const suggested = renderMap(p, paused);
      const wasHidden = map.hidden;
      map.hidden = false;
      // Première ouverture : on amène le chapitre en cours à l'écran.
      if (wasHidden && firstMap && suggested && suggested.chapter > 1) {
        chapters.querySelector(`[data-chapter="${suggested.chapter}"]`)?.scrollIntoView({ block: 'start' });
      }
      firstMap = false;
    },
    showCarnet(p) {
      renderCarnet(p);
      map.hidden = true;
      carnet.hidden = false;
      carnet.scrollTop = 0;
    },
    refreshCarnet(p) {
      if (!carnet.hidden) renderCarnet(p);
    },
    hide() {
      closePage();
      map.hidden = true;
      carnet.hidden = true;
    },
  };
}
