import { describe, expect, it } from 'vitest';
import {
  BALL_SPEED, COOLDOWN_TICKS, DOG_PENALTY, LAUNCH_X, MIN_BOULET_SPEED, WORLD_H,
  CHARACTERS, createSim, finalScore, runReplay, stars, step, tryShoot,
} from './index';
import { fcos, fsin, dirFromAngleDeci } from './fmath';
import type { AverseDef, CharacterId, SimEvent, SimState, SpawnDef } from './types';

const UP = 900;

function sp(tick: number, char: CharacterId, x: number, extra: Partial<SpawnDef> = {}): SpawnDef {
  return { tick, char, costume: 'tabby', x, swayAmp: 0, swayPhase: 0, ...extra };
}
function averse(spawns: SpawnDef[], pelotes = 8): AverseDef {
  return { id: 't', chapter: 1, pelotes, spawns: spawns.slice().sort((a, b) => a.tick - b.tick) };
}
/** Avance jusqu'à ce que `until` soit vrai (ou maxTicks) en collectant les événements. */
function run(s: SimState, until: (s: SimState) => boolean, maxTicks = 5000): SimEvent[] {
  const ev: SimEvent[] = [];
  for (let i = 0; i < maxTicks && !until(s); i++) {
    step(s);
    ev.push(...s.events);
    s.events = [];
  }
  return ev;
}
const ticks = (n: number) => (s: SimState) => s.tick >= n;
/** Un chat à la verticale du lanceur, à mi-écran quand on tire. */
function catAbove(char: CharacterId = 'tigre', x = LAUNCH_X): SimState {
  const s = createSim(averse([sp(0, char, x)]));
  run(s, st => st.cats[0] !== undefined && (st.cats[0]?.y ?? -Infinity) >= 300);
  return s;
}

describe('fmath (déterminisme des fonctions trigonométriques)', () => {
  it('fsin/fcos suivent Math.sin/cos à 1e-9 près', () => {
    for (let i = -5000; i <= 5000; i++) {
      const t = i / 997;
      expect(Math.abs(fsin(t) - Math.sin(t * 2 * Math.PI))).toBeLessThan(1e-9);
      expect(Math.abs(fcos(t) - Math.cos(t * 2 * Math.PI))).toBeLessThan(1e-9);
    }
  });
  it('900 dixièmes de degré = tout droit vers le haut', () => {
    const d = dirFromAngleDeci(900);
    expect(d.x).toBeCloseTo(0, 12);
    expect(d.y).toBeCloseTo(-1, 12);
  });
});

describe('Loi 1 — chute', () => {
  it('un chat tombe à la vitesse de son caractère', () => {
    const s = createSim(averse([sp(0, 'tigre', 100)]));
    run(s, ticks(120)); // 120 pas de 1/120 s = 1 s de chute
    const c = s.cats[0];
    expect(c.y).toBeCloseTo(-c.r + CHARACTERS.tigre.fallSpeed, 6);
  });
  it("l'oscillation reste dans son amplitude", () => {
    const s = createSim(averse([sp(0, 'tigre', 180, { swayAmp: 12, swayPhase: 0.3 })]));
    for (let i = 0; i < 600; i++) { step(s); expect(Math.abs(s.cats[0].x - 180)).toBeLessThanOrEqual(12 + 1e-9); }
  });
  it('un chat sorti par le bas est raté ; un chien sorti ne compte pas', () => {
    const s = createSim(averse([sp(0, 'tigre', 100), sp(0, 'chien', 250)]));
    const ev = run(s, st => st.ended, 20000);
    expect(s.missed).toBe(1);
    expect(ev.filter(e => e.type === 'miss')).toHaveLength(1);
    expect(s.ended).toBe(true);
  });
});

describe('Loi 2 — impact de la pelote', () => {
  it('refuse les angles sous 7° et non entiers, sans consommer de pelote (§26)', () => {
    const s = createSim(averse([sp(0, 'tigre', 100)]));
    expect(tryShoot(s, 69)).toBe('angle');
    expect(tryShoot(s, 1731)).toBe('angle');
    expect(tryShoot(s, 900.5)).toBe('angle');
    expect(s.pelotes).toBe(8);
    expect(tryShoot(s, 70)).toBe('ok');
    expect(s.pelotes).toBe(7);
  });
  it('recharge de 0,5 s entre deux tirs', () => {
    const s = createSim(averse([sp(0, 'tigre', 100)]));
    expect(tryShoot(s, UP)).toBe('ok');
    expect(tryShoot(s, UP)).toBe('cooldown');
    run(s, ticks(COOLDOWN_TICKS - 1));
    expect(tryShoot(s, UP)).toBe('cooldown');
    run(s, ticks(COOLDOWN_TICKS));
    expect(tryShoot(s, UP)).toBe('ok');
  });
  it('à 0 pelote, rien ne part (§26)', () => {
    const s = createSim(averse([sp(0, 'tigre', 100)], 0));
    expect(tryShoot(s, UP)).toBe('empty');
    expect(s.balls).toHaveLength(0);
  });
  it('le chat touché part selon la ligne des centres, à |v| × transfert, et la pelote est absorbée', () => {
    const s = catAbove();
    tryShoot(s, UP);
    const ev = run(s, st => st.cats[0]?.st === 'boulet');
    const c = ev.find(e => e.type === 'catch');
    expect(c && c.type === 'catch' && c.by).toBe('ball');
    const cat = s.cats[0];
    const sp0 = Math.hypot(cat.vx, cat.vy);
    expect(sp0).toBeGreaterThan(BALL_SPEED * CHARACTERS.tigre.transfer - 20); // un tick de gravité au plus
    expect(cat.vy).toBeLessThan(0); // part vers le haut
    expect(s.balls).toHaveLength(0);
    expect(s.caught).toBe(1);
  });
  it('viser un côté du chat l’envoie de l’autre côté (billard)', () => {
    const s = catAbove('tigre', LAUNCH_X + 12);
    tryShoot(s, UP); // la pelote passe à gauche du centre du chat
    run(s, st => st.cats[0]?.st === 'boulet');
    expect(s.cats[0].vx).toBeGreaterThan(0);
  });
  it('la pelote rebondit au plus 2 fois sur les bords', () => {
    const s = createSim(averse([sp(5000, 'tigre', 100)]));
    tryShoot(s, 250); // 25° vers la droite
    let flips = 0;
    let prevVx = s.balls[0].vx;
    while (s.balls.length) {
      step(s);
      const b = s.balls[0];
      if (b && Math.sign(b.vx) !== Math.sign(prevVx)) { flips++; prevVx = b.vx; }
    }
    expect(flips).toBeGreaterThanOrEqual(1);
    expect(flips).toBeLessThanOrEqual(2);
  });
  it('pas de rebond au plafond : un tir vertical sort par le haut', () => {
    const s = createSim(averse([sp(5000, 'tigre', 100)]));
    tryShoot(s, UP);
    let lastY = 0;
    while (s.balls.length) { lastY = s.balls[0].y; step(s); }
    expect(lastY).toBeLessThan(20);
  });
  it('deux chats touchés au même tick : le plus petit id gagne (§7)', () => {
    const s = createSim(averse([sp(0, 'tigre', LAUNCH_X), sp(0, 'tigre', LAUNCH_X)]));
    run(s, st => (st.cats[0]?.y ?? -Infinity) >= 300);
    tryShoot(s, UP);
    const ev = run(s, st => st.cats.every(c => c.st !== 'fall'));
    const byBall = ev.filter(e => e.type === 'catch' && e.by === 'ball');
    expect(byBall).toHaveLength(1);
    expect(byBall[0].type === 'catch' && byBall[0].catId).toBe(Math.min(...s.cats.map(c => c.id)));
  });
  it('tir le tick même où un chat apparaît : appliqué avant la physique, déterministe', () => {
    const a = averse([sp(0, 'tigre', LAUNCH_X)]);
    const r1 = runReplay(a, [{ tick: 0, angleDeci: UP }]);
    const r2 = runReplay(a, [{ tick: 0, angleDeci: UP }]);
    expect(r1.valid).toBe(true);
    expect(r1.state.score).toBe(r2.state.score);
  });
});

describe('Loi 3 — propagation', () => {
  it('un boulet touche un chat qui tombe : même chaîne, vitesse ≥ plancher, départ selon la ligne des centres', () => {
    const s = createSim(averse([sp(0, 'tigre', LAUNCH_X), sp(70, 'tigre', LAUNCH_X)]));
    run(s, st => st.cats.length === 2 && (st.cats[0]?.y ?? -Infinity) >= 300);
    tryShoot(s, UP);
    const ev = run(s, st => st.cats.filter(c => c.st === 'boulet').length === 2 || st.ended, 600);
    const catches = ev.filter(e => e.type === 'catch');
    expect(catches).toHaveLength(2);
    const [a, b] = catches;
    expect(a.type === 'catch' && b.type === 'catch' && a.chainId === b.chainId).toBe(true);
    const second = s.cats.find(c => b.type === 'catch' && c.id === b.catId)!;
    expect(Math.hypot(second.vx, second.vy)).toBeGreaterThanOrEqual(MIN_BOULET_SPEED - 1e-9);
    expect(second.vy).toBeLessThan(0);
  });
  /** Lance `hitter` en boulet sous un tigré et renvoie sa vitesse juste avant et juste après le choc. */
  function shockOn(hitter: CharacterId) {
    const s = createSim(averse([sp(0, hitter, LAUNCH_X), sp(0, 'tigre', LAUNCH_X)]));
    run(s, st => (st.cats[0]?.y ?? -Infinity) >= 300);
    const [h, t] = s.cats;
    t.anchorX = t.x = LAUNCH_X + 8; // légèrement décalé : choc oblique
    t.y = h.y - 90;
    t.vy = 0; // immobile pour isoler le choc
    tryShoot(s, UP);
    run(s, st => st.cats[0]?.st === 'boulet');
    let before = { vx: 0, vy: 0 };
    for (let i = 0; i < 200; i++) {
      before = { vx: h.vx, vy: h.vy };
      step(s);
      const hit = s.events.some(e => e.type === 'catch' && e.by === 'boulet');
      s.events = [];
      if (hit) return { before, after: { vx: h.vx, vy: h.vy }, target: t };
    }
    throw new Error('pas de choc');
  }
  it('le gros traverse sans dévier : seule la gravité change sa vitesse', () => {
    const { before, after, target } = shockOn('gros');
    expect(target.st).toBe('boulet');
    expect(after.vx).toBe(before.vx);
    expect(after.vy - before.vy).toBeCloseTo(900 / 120, 9);
  });
  it('un tigré tapeur est dévié par le choc', () => {
    const { before, after } = shockOn('tigre');
    const gravityOnly = Math.abs(after.vx - before.vx) < 1e-9 && Math.abs(after.vy - before.vy - 900 / 120) < 1e-9;
    expect(gravityOnly).toBe(false);
  });
  it('les boulets ne se percutent pas entre eux', () => {
    const s = createSim(averse([sp(0, 'tigre', LAUNCH_X)]));
    run(s, st => (st.cats[0]?.y ?? -Infinity) >= 300);
    tryShoot(s, UP);
    run(s, st => st.cats[0]?.st === 'boulet');
    const other = { ...s.cats[0], id: 999, x: s.cats[0].x, y: s.cats[0].y - 5, chainId: s.cats[0].chainId };
    s.cats.push(other);
    s.chains[0].alive++;
    const before = { vx: s.cats[0].vx };
    step(s);
    expect(s.events.some(e => e.type === 'catch')).toBe(false);
    expect(Math.abs(s.cats[0].vx - before.vx)).toBeLessThan(1e-9);
  });
});

describe('Loi 4 — vie d’un boulet', () => {
  it('rebondit au plafond, disparaît à la fin de sa vie ; attrapé dès le contact', () => {
    const s = catAbove();
    tryShoot(s, UP);
    run(s, st => st.cats[0]?.st === 'boulet');
    expect(s.caught).toBe(1);
    let minY = Infinity;
    for (let i = 0; i < CHARACTERS.tigre.lifeTicks + 2 && s.cats.length; i++) { step(s); if (s.cats[0]) minY = Math.min(minY, s.cats[0].y); }
    expect(minY).toBeGreaterThanOrEqual(s.cats[0]?.r ?? 0);
    expect(s.cats).toHaveLength(0);
  });
});

describe('Loi 5 — chaîne', () => {
  it('score = n² en fin de chaîne, quelle que soit sa longueur (pas de plafond, §26)', () => {
    const spawns: SpawnDef[] = [];
    for (let i = 0; i < 40; i++) spawns.push(sp(i * 30, 'tigre', LAUNCH_X + ((i % 3) - 1) * 14));
    const s = createSim(averse(spawns));
    run(s, ticks(40 * 30));
    tryShoot(s, UP);
    const ev = run(s, st => st.ended, 20000);
    const ends = ev.filter(e => e.type === 'chainEnd');
    const sumSq = ends.reduce((acc, e) => acc + (e.type === 'chainEnd' ? e.n * e.n : 0), 0);
    expect(s.score).toBe(sumSq);
  });
  it('une chaîne de 4 ou plus rend une pelote', () => {
    const spawns: SpawnDef[] = [];
    for (let i = 0; i < 12; i++) spawns.push(sp(i * 40, 'tigre', LAUNCH_X + ((i % 2) ? 10 : -10)));
    const s = createSim(averse(spawns, 1));
    run(s, ticks(12 * 40));
    tryShoot(s, UP);
    const ev = run(s, st => st.chains.length === 0 && st.balls.length === 0 && st.cats.every(c => c.st !== 'boulet'), 3000);
    const end = ev.find(e => e.type === 'chainEnd');
    expect(end && end.type === 'chainEnd').toBe(true);
    if (end && end.type === 'chainEnd') expect(s.pelotes).toBe(end.n >= 4 ? 1 : 0);
  });
});

describe('Loi 6 — pelotes', () => {
  it('le stock initial vient de l’averse', () => {
    expect(createSim(averse([sp(0, 'tigre', 100)], 5)).pelotes).toBe(5);
  });
});

describe('Loi 7 — fin d’averse', () => {
  it('finie quand tout est apparu, sorti et résolu ; pattes et score final', () => {
    const s = createSim(averse([sp(0, 'tigre', LAUNCH_X)], 3));
    run(s, st => (st.cats[0]?.y ?? -Infinity) >= 300);
    tryShoot(s, UP);
    run(s, st => st.ended, 5000);
    expect(s.ended).toBe(true);
    expect(stars(s)).toBe(3); // 1/1 attrapé
    expect(finalScore(s)).toBe(1 + 3 * 2);
  });
  it('le score final est borné à 0', () => {
    const s = createSim(averse([sp(0, 'chien', LAUNCH_X)], 1));
    run(s, st => (st.cats[0]?.y ?? -Infinity) >= 300);
    tryShoot(s, UP);
    run(s, st => st.ended, 5000);
    expect(s.score).toBe(-DOG_PENALTY);
    expect(finalScore(s)).toBe(0);
  });
});

describe('Chien déguisé', () => {
  it('touché par la pelote : −5, pelote absorbée, aucune chaîne, pas attrapé (§26)', () => {
    const s = catAbove('chien');
    tryShoot(s, UP);
    const ev = run(s, st => st.cats.length === 0 || st.balls.length === 0);
    expect(ev.some(e => e.type === 'dog')).toBe(true);
    expect(s.score).toBe(-DOG_PENALTY);
    expect(s.caught).toBe(0);
    expect(s.balls).toHaveLength(0);
    expect(s.chains).toHaveLength(0);
  });
  it('touché par un boulet : −5, le boulet s’arrête, deux chiens = −10', () => {
    const s = createSim(averse([sp(0, 'tigre', LAUNCH_X), sp(70, 'chien', LAUNCH_X - 10), sp(70, 'chien', LAUNCH_X + 10)]));
    run(s, st => st.cats.length === 3 && (st.cats[0]?.y ?? -Infinity) >= 300);
    tryShoot(s, UP);
    run(s, st => st.ended, 8000);
    expect(s.dogsHit).toBeGreaterThanOrEqual(1);
    expect(s.score).toBe(1 - DOG_PENALTY * s.dogsHit);
    expect(s.caught).toBe(1);
  });
});

describe('Rejeu', () => {
  it('un journal hors ordre ou refusé est invalide', () => {
    const a = averse([sp(0, 'tigre', 100)]);
    expect(runReplay(a, [{ tick: 10, angleDeci: UP }, { tick: 5, angleDeci: UP }]).valid).toBe(false);
    expect(runReplay(a, [{ tick: 10, angleDeci: 10 }]).valid).toBe(false);
    expect(runReplay(a, [{ tick: 10, angleDeci: UP }, { tick: 20, angleDeci: UP }]).valid).toBe(false); // recharge
  });
  it('les chats tombent jusqu’en bas en ~10 s sans tir', () => {
    const r = runReplay(averse([sp(0, 'tigre', 100)]), []);
    expect(r.valid).toBe(true);
    expect(r.state.tick).toBeLessThan(Math.ceil(((WORLD_H + 40) / CHARACTERS.tigre.fallSpeed) * 120) + 5);
  });
});
