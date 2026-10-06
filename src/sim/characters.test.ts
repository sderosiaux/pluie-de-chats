// Porte P4 : chaque règle de caractère (GAME_SPEC §8) et chaque ligne de la matrice §9 a son test.
// Les situations sont construites à la main (positions et boulets posés directement) pour isoler
// une seule interaction à la fois.

import { describe, expect, it } from 'vitest';
import { CHARACTERS, LAUNCH_X, WORLD_W, createSim, step, tryShoot } from './index';
import type { AverseDef, Cat, CharacterId, SimEvent, SimState, SpawnDef } from './types';

const DT_G = 900 / 120; // gravité d'un boulet sur un tick

function sp(char: CharacterId, x: number, extra: Partial<SpawnDef> = {}): SpawnDef {
  return { tick: 0, char, costume: 'x', x, swayAmp: 0, swayPhase: 0, ...extra };
}
/** Fait apparaître les chats puis les fige à des positions données (y), sans avancer le temps davantage. */
function scene(spawns: SpawnDef[], ys: number[], pelotes = 5): SimState {
  const a: AverseDef = { id: 't', chapter: 6, pelotes, spawns };
  const s = createSim(a);
  step(s);
  s.events = [];
  s.cats.forEach((c, i) => { c.y = ys[i]; });
  return s;
}
/** Transforme `c` en boulet d'une nouvelle chaîne (comme si une pelote l'avait touché). */
function launch(s: SimState, c: Cat, vx: number, vy: number): void {
  const chain = { id: s.nextId++, n: 1, alive: 1, done: false };
  s.chains.push(chain);
  Object.assign(c, { st: 'boulet', vx, vy, life: CHARACTERS[c.char].lifeTicks, chainId: chain.id, escortOf: -1 });
  s.caught++;
}
function runTicks(s: SimState, n: number): SimEvent[] {
  const ev: SimEvent[] = [];
  for (let i = 0; i < n && !s.ended; i++) { step(s); ev.push(...s.events); s.events = []; }
  return ev;
}
const catches = (ev: SimEvent[]) => ev.filter(e => e.type === 'catch');

describe('§8 règles de caractère', () => {
  it('gros : traverse une rangée de tigrés alignés sans dévier (§9 « gros + grappe »)', () => {
    const s = scene([sp('gros', 180), sp('tigre', 180), sp('tigre', 180), sp('tigre', 180)], [500, 420, 340, 260]);
    const [gros] = s.cats;
    launch(s, gros, 0, -700);
    const ev = runTicks(s, 60);
    expect(catches(ev)).toHaveLength(3);
    expect(gros.vx).toBe(0); // jamais dévié
  });

  it('gros boulet contre bouclier : le bouclier part tout de suite (compte pour les deux contacts, §9)', () => {
    const s = scene([sp('gros', 180), sp('bouclier', 180)], [500, 400]);
    launch(s, s.cats[0], 0, -700);
    const ev = runTicks(s, 30);
    expect(ev.some(e => e.type === 'shield')).toBe(true);
    expect(s.cats[1].st).toBe('boulet');
  });

  it('chaton : en boulet, il s’éteint vite (vie la plus courte, §9 « la chaîne meurt vite »)', () => {
    const s = scene([sp('chaton', 180)], [300]);
    launch(s, s.cats[0], 200, -200);
    runTicks(s, CHARACTERS.chaton.lifeTicks);
    expect(s.cats).toHaveLength(0);
    expect(CHARACTERS.chaton.lifeTicks).toBeLessThan(CHARACTERS.tigre.lifeTicks);
  });

  it('trouillard : esquive la pelote (bond latéral)', () => {
    const s = scene([sp('trouillard', LAUNCH_X)], [300]);
    const x0 = s.cats[0].x;
    tryShoot(s, 900);
    const ev = runTicks(s, 90);
    expect(ev.some(e => e.type === 'dodge')).toBe(true);
    expect(catches(ev)).toHaveLength(0);
    expect(Math.abs(s.cats[0].x - x0)).toBeGreaterThan(20);
  });

  it('trouillard : n’esquive jamais un boulet (§9)', () => {
    const s = scene([sp('tigre', 180), sp('trouillard', 180)], [450, 360]);
    launch(s, s.cats[0], 0, -700);
    const ev = runTicks(s, 30);
    expect(ev.some(e => e.type === 'dodge')).toBe(false);
    expect(s.cats[1].st).toBe('boulet');
  });

  it('trouillard qui bondit dans la trajectoire d’un boulet : pris (§9)', () => {
    // La pelote passe à droite du trouillard (x = 175) et le fait bondir vers la gauche, droit dans la
    // colonne où monte un boulet (x = 100). Scène trouvée par balayage de paramètres.
    const s = scene([sp('tigre', 100), sp('trouillard', LAUNCH_X - 5)], [500, 300]);
    const trouillard = s.cats[1];
    tryShoot(s, 900);
    launch(s, s.cats[0], 0, -500);
    const ev = runTicks(s, 120);
    expect(ev.some(e => e.type === 'dodge' && e.catId === trouillard.id)).toBe(true);
    expect(ev.some(e => e.type === 'catch' && e.catId === trouillard.id && e.by === 'boulet')).toBe(true);
  });

  it('bouclier : deux coups de pelote (le 1er casse et renvoie la pelote, le 2e attrape)', () => {
    const s = scene([sp('bouclier', LAUNCH_X)], [300]);
    tryShoot(s, 900);
    const ev1 = runTicks(s, 60);
    expect(ev1.some(e => e.type === 'shield')).toBe(true);
    expect(s.cats[0].st).toBe('fall');
    expect(tryShoot(s, 900)).toBe('ok');
    const ev2 = runTicks(s, 90);
    expect(catches(ev2)).toHaveLength(1);
  });

  it('tigré boulet contre bouclier intact : rebondit dessus comme sur une bande (§9)', () => {
    const s = scene([sp('tigre', 180), sp('bouclier', 180)], [450, 360]);
    const t = s.cats[0];
    launch(s, t, 0, -700);
    const ev = runTicks(s, 20);
    expect(ev.some(e => e.type === 'shield')).toBe(true);
    expect(s.cats[1].st).toBe('fall');
    expect(s.cats[1].shield).toBe(false);
    expect(t.vy).toBeGreaterThan(0); // renvoyé vers le bas
  });

  it('fusée : en boulet, ligne droite sans gravité, sort sans rebondir', () => {
    const s = scene([sp('fusee', 180)], [300]);
    const f = s.cats[0];
    launch(s, f, 600, -100);
    runTicks(s, 10);
    expect(f.vx).toBe(600);
    expect(f.vy).toBe(-100); // aucune gravité
    runTicks(s, 120);
    expect(s.cats).toHaveLength(0); // sorti par le bord, pas de rebond
  });

  it('fusée : balaie une rangée horizontale (§9)', () => {
    const s = scene([sp('fusee', 40), sp('tigre', 120), sp('tigre', 200), sp('tigre', 280)], [300, 300, 300, 300]);
    launch(s, s.cats[0], 700, 0);
    const ev = runTicks(s, 60);
    expect(catches(ev)).toHaveLength(3);
  });

  it('élastique : accélère à chaque rebond sur un mur (§9)', () => {
    const s = scene([sp('elastique', WORLD_W - 40)], [300]);
    const e = s.cats[0];
    launch(s, e, 600, 0);
    let before = 0;
    const ev: SimEvent[] = [];
    for (let i = 0; i < 20 && !ev.some(x => x.type === 'bounce'); i++) { before = Math.abs(e.vx); step(s); ev.push(...s.events); s.events = []; }
    expect(ev.some(x => x.type === 'bounce')).toBe(true);
    expect(Math.abs(e.vx)).toBeCloseTo(before * 1.15, 9);
  });

  it('un tigré, lui, perd de la vitesse au rebond (restitution 0,8)', () => {
    const s = scene([sp('tigre', WORLD_W - 40)], [300]);
    const t = s.cats[0];
    launch(s, t, 600, 0);
    let before = 0;
    for (let i = 0; i < 20 && t.vx > 0; i++) { before = t.vx; step(s); s.events = []; }
    expect(Math.abs(t.vx)).toBeCloseTo(before * 0.8, 9);
  });

  it('fantôme : les boulets le traversent (§9)', () => {
    const s = scene([sp('tigre', 180), sp('fantome', 180)], [450, 380]);
    launch(s, s.cats[0], 0, -700);
    const ev = runTicks(s, 20);
    expect(catches(ev)).toHaveLength(0);
    expect(s.cats.find(c => c.char === 'fantome')?.st).toBe('fall');
  });

  it('fantôme : seule la pelote l’attrape, et en boulet il ne touche rien (§9)', () => {
    const s = scene([sp('fantome', LAUNCH_X), sp('tigre', LAUNCH_X)], [300, 240]);
    tryShoot(s, 900);
    const ev = runTicks(s, 60);
    expect(catches(ev)).toHaveLength(1); // le fantôme, pas le tigré au-dessus
    expect(s.cats.find(c => c.char === 'tigre')?.st).toBe('fall');
  });

  it('maman : ses chatons d’escorte la suivent en tombant', () => {
    const s = scene([sp('maman', 180), sp('chaton', 150, { escortOf: 0, escortDx: -30, escortDy: 10 })], [200, 210]);
    runTicks(s, 30);
    const [mom, kit] = s.cats;
    expect(kit.x - mom.x).toBeCloseTo(-30, 9);
    expect(kit.y - mom.y).toBeCloseTo(10, 9);
  });

  it('maman attrapée : ses chatons partent vers elle dans la même chaîne (§9)', () => {
    const s = scene([
      sp('maman', LAUNCH_X),
      sp('chaton', LAUNCH_X - 34, { escortOf: 0, escortDx: -34, escortDy: 8 }),
      sp('chaton', LAUNCH_X + 34, { escortOf: 0, escortDx: 34, escortDy: 8 }),
    ], [300, 308, 308]);
    tryShoot(s, 900);
    const ev = runTicks(s, 60);
    const c = catches(ev);
    expect(c).toHaveLength(3);
    expect(new Set(c.map(e => (e.type === 'catch' ? e.chainId : -1))).size).toBe(1);
  });

  it('maman sortie de l’écran : les chatons redeviennent autonomes et continuent de tomber', () => {
    const s = scene([sp('maman', 180), sp('chaton', 150, { escortOf: 0, escortDx: -30, escortDy: 10 })], [600, 610]);
    runTicks(s, 120);
    expect(s.missed).toBe(2);
  });
});

describe('§9 garde-fous transversaux', () => {
  it('un boulet ne gagne de la gravité que s’il n’est pas une fusée', () => {
    const s = scene([sp('tigre', 100), sp('fusee', 260)], [300, 300]);
    launch(s, s.cats[0], 0, -300);
    launch(s, s.cats[1], 0, -300);
    runTicks(s, 1);
    expect(s.cats[0].vy).toBeCloseTo(-300 + DT_G, 9);
    expect(s.cats[1].vy).toBe(-300);
  });
});
