// Porte E2E P1 : le vrai jeu, dans un vrai navigateur. Un tir au doigt (souris), une chaîne ≥ 2,
// puis l'écran de fin avec ses pattes. Tout passe par la sim déterministe : le scénario est reproductible.
import { expect, test } from '@playwright/test';
import type { PdcDebug } from '../src/game/main';
import fixtures from '../src/sim/fixtures/replays.json' with { type: 'json' };

declare global { interface Window { __pdc?: PdcDebug } }

test('P1 : tir réel, carambolage, écran de fin', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?debug&averse=h1');
  await page.waitForFunction(() => !!window.__pdc);

  // 1. Un tir par le vrai chemin d'entrée : clic au-dessus du lanceur.
  const box = (await page.locator('#game').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.3);
  await expect.poll(() => page.evaluate(() => window.__pdc!.sim().log.length)).toBe(1);
  // Clic à la verticale du lanceur : entrée → conversion écran/monde → angle ≈ tout droit (900).
  const angle = await page.evaluate(() => window.__pdc!.sim().log[0].angleDeci);
  expect(Math.abs(angle - 900)).toBeLessThanOrEqual(15);

  // 2. Quand la grappe de h1 est à mi-écran, le meilleur tir déclenche une chaîne d'au moins 2 chats.
  const bestChain = await page.evaluate(() => {
    const p = window.__pdc!;
    p.fastForward(Math.max(0, 1300 - p.sim().tick));
    const a = p.bestAngle();
    if (a === null) return -1;
    if (p.shoot(a) !== 'ok') return -2;
    p.fastForward(600);
    return p.sim().bestChain;
  });
  expect(bestChain).toBeGreaterThanOrEqual(2);

  // 3. Fin d'averse : l'écran de fin s'affiche avec ses trois pattes et le score final.
  await page.evaluate(() => window.__pdc!.fastForward(120 * 60 * 3));
  const end = page.locator('#end');
  await expect(end).toBeVisible();
  await expect(end.locator('.paw')).toHaveCount(3);
  const stars = await page.evaluate(() => {
    const s = window.__pdc!.sim();
    const total = s.averse.spawns.filter(sp => sp.char !== 'chien').length;
    const r = s.caught / total;
    return r >= 0.9 ? 3 : r >= 0.75 ? 2 : r >= 0.5 ? 1 : 0;
  });
  await expect(end.locator('.paw.on')).toHaveCount(stars);
  await expect(page.locator('#end-score')).toHaveText(/^\d+$/);
  await expect(page.locator('#end-chain')).toHaveText(/×\d+/);

  // 4. Rejouer relance la même averse, à zéro.
  await page.locator('#replay').click();
  await expect(end).toBeHidden();
  expect(await page.evaluate(() => window.__pdc!.sim().log.length)).toBe(0);

  expect(errors).toEqual([]);
});

// Déterminisme dans le moteur JS du navigateur (V8 pour Chromium, JavaScriptCore pour WebKit) :
// les journaux figés sous Node doivent redonner le même hash au bit près (§24).
test('rejeu des journaux figés : même hash et même score que sous Node', async ({ page }) => {
  await page.goto('/?debug&averse=h1');
  await page.waitForFunction(() => !!window.__pdc);
  for (const f of fixtures) {
    const r = await page.evaluate(([id, log]) => window.__pdc!.replayHash(id, log), [f.averseId, f.log] as const);
    expect(r.valid).toBe(true);
    expect(r.hash).toBe(f.hash);
    expect(r.score).toBe(f.score);
  }
});
