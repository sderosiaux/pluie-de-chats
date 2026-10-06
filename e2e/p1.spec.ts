// Porte E2E P1 : le vrai jeu, dans un vrai navigateur. Un tir au doigt (souris), une chaîne ≥ 2,
// puis l'écran de fin avec ses pattes. Tout passe par la sim déterministe : le scénario est reproductible.
import { expect, test } from '@playwright/test';
import type { PdcDebug } from '../src/game/main';

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
  await expect(page.locator('#end-score')).toHaveText(/^\d+$/);
  await expect(page.locator('#end-chain')).toHaveText(/×\d+/);

  // 4. Rejouer relance la même averse, à zéro.
  await page.locator('#replay').click();
  await expect(end).toBeHidden();
  expect(await page.evaluate(() => window.__pdc!.sim().log.length)).toBe(0);

  expect(errors).toEqual([]);
});
