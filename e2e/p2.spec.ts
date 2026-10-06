// Porte E2E P2 : la campagne. Carte au lancement, déblocage par les pattes, persistance locale,
// carnet, et sim figée hors de l'écran de jeu (§30.9). Les averses jouées sont celles de la campagne
// figée : le scénario ne dépend d'aucune valeur de graine, seulement des règles (§10).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { PdcDebug } from '../src/game/main';
import { STORAGE_KEY } from '../src/game/progress';

declare global { interface Window { __pdc?: PdcDebug } }

const tile = (page: Page, id: string) => page.locator(`#chapters [data-averse="${id}"]`);

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}

async function open(page: Page, query: string): Promise<void> {
  await page.goto(`/${query}`);
  await page.waitForFunction(() => !!window.__pdc);
}

/** Attend que l'averse `id` soit chargée (le lancement est asynchrone : sprites). */
async function waitAverse(page: Page, id: string): Promise<void> {
  await page.waitForFunction(id => {
    try { return window.__pdc!.sim().averse.id === id; } catch { return false; }
  }, id);
}

const tick = (page: Page): Promise<number> => page.evaluate(() => window.__pdc!.sim().tick);

/**
 * Joue l'averse chargée jusqu'au bout, par les outils de débogage : toutes les 30 ticks, si une grappe
 * (≥ 4 chats à moins de 90 px les uns des autres) est à l'écran, ou si un chat va sortir, tir au meilleur
 * angle. Renvoie le résultat ET la progression stockée au tick de fin, avant tout écran de fin.
 */
function playToEnd(key: string) {
  const p = window.__pdc!;
  let guard = 0;
  while (!p.sim().ended && guard++ < 3000) {
    p.fastForward(30);
    const s = p.sim();
    if (s.ended || s.pelotes === 0 || s.cooldown > 0) continue;
    const fall = s.cats.filter(c => c.st === 'fall' && c.char !== 'chien');
    let cluster = 0;
    for (const c of fall) {
      if (c.y < 80 || c.y > 450) continue;
      cluster = Math.max(cluster, fall.filter(d => (d.x - c.x) * (d.x - c.x) + (d.y - c.y) * (d.y - c.y) < 90 * 90).length);
    }
    const escaping = fall.some(c => c.y > 440);
    const allIn = s.nextSpawn >= s.averse.spawns.length;
    if (cluster >= 4 || (escaping && s.pelotes > 2) || (allIn && fall.length > 0)) {
      const a = p.bestAngle();
      if (a !== null) p.shoot(a);
    }
  }
  const s = p.sim();
  const catchable = s.averse.spawns.filter(sp => sp.char !== 'chien').length;
  return { ended: s.ended, caught: s.caught, catchable, stored: localStorage.getItem(key) };
}

test('carte au lancement, 1-1 jouée → 1-2 débloquée et conservée après rechargement, carnet', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, '?debug');

  // 1. Arrivée : la carte, 1-1 jouable, 1-2 verrouillée, un état vide qui guide.
  const map = page.locator('#map');
  await expect(map).toBeVisible();
  await expect(tile(page, '1-1')).toHaveAttribute('data-state', 'open');
  await expect(tile(page, '1-1')).toBeEnabled();
  await expect(tile(page, '1-2')).toHaveAttribute('data-state', 'locked');
  await expect(tile(page, '1-2')).toBeDisabled();
  await expect(tile(page, '1-5')).toContainText('Grande averse');
  await expect(page.locator('#map-cta')).toContainText('Commence par la première averse');

  // 2. 1-1 jouée jusqu'à au moins une patte.
  await tile(page, '1-1').click();
  await expect(map).toBeHidden();
  await waitAverse(page, '1-1');
  const r = await page.evaluate(playToEnd, STORAGE_KEY);
  expect(r.ended).toBe(true);
  expect(r.caught / r.catchable).toBeGreaterThanOrEqual(0.5);
  // La progression est écrite dès la fin de la sim, avant l'écran de fin.
  expect(JSON.parse(r.stored ?? 'null')?.averses?.['1-1']?.stars).toBeGreaterThanOrEqual(1);

  const end = page.locator('#end');
  await expect(end).toBeVisible();
  await expect(end.locator('.paw.on')).not.toHaveCount(0);
  await expect(page.locator('#end-unlock')).toContainText('1-2');
  await expect(page.locator('#next')).toBeVisible();
  await expect(page.locator('#next')).toContainText('1-2');

  // 3. Retour à la carte : 1-2 débloquée, et toujours après rechargement.
  await page.locator('#end-map').click();
  await expect(map).toBeVisible();
  await expect(tile(page, '1-1')).toHaveAttribute('data-state', 'done');
  await expect(tile(page, '1-2')).toHaveAttribute('data-state', 'open');
  await expect(tile(page, '1-3')).toHaveAttribute('data-state', 'locked');
  await page.reload();
  await expect(map).toBeVisible();
  await expect(tile(page, '1-2')).toHaveAttribute('data-state', 'open');
  await expect(tile(page, '1-2')).toBeEnabled();

  // 4. Carnet : le tigré rencontré, des « ? » pour les neuf autres.
  await page.locator('#open-carnet').click();
  const grid = page.locator('#carnet-grid');
  await expect(grid).toBeVisible();
  const tigre = grid.locator('[data-char="tigre"]');
  await expect(tigre).toHaveAttribute('data-state', 'met');
  await expect(tigre).toContainText('Tigré');
  await expect(tigre).toContainText('nouveau');
  const unknown = grid.locator('[data-state="unknown"]');
  await expect(unknown).toHaveCount(9);
  for (const card of await unknown.all()) await expect(card).toContainText('?');
  await tigre.click();
  await expect(page.locator('#page')).toBeVisible();
  await expect(page.locator('#page-name')).toHaveText('Tigré');
  expect(await page.locator('#page-costumes img').count()).toBeGreaterThan(0);
  await page.locator('#page-close').click();
  await expect(tigre).not.toContainText('nouveau');

  expect(errors).toEqual([]);
});

test('la sim ne tourne ni carte ouverte, ni carnet ouvert, ni onglet caché', async ({ page }) => {
  const errors = watchErrors(page);
  // 1-1 est toujours débloquée : ?averse=1-1 l'ouvre directement.
  await open(page, '?debug&averse=1-1');
  await waitAverse(page, '1-1');
  await expect.poll(() => tick(page)).toBeGreaterThan(30);

  // Carte ouverte par le bouton de pause : l'averse reste chargée, figée.
  await page.locator('#to-map').click();
  await expect(page.locator('#map')).toBeVisible();
  const t0 = await tick(page);
  await page.waitForTimeout(700);
  expect(await tick(page)).toBe(t0);

  // Carnet ouvert depuis la carte : toujours figée.
  await page.locator('#open-carnet').click();
  await expect(page.locator('#carnet')).toBeVisible();
  await page.waitForTimeout(500);
  expect(await tick(page)).toBe(t0);
  await page.locator('#carnet-back').click();

  // Reprise depuis la carte.
  await expect(page.locator('#map-cta-go')).toHaveText('Reprendre');
  await page.locator('#map-cta-go').click();
  await expect(page.locator('#map')).toBeHidden();
  await expect.poll(() => tick(page)).toBeGreaterThan(t0);

  // Onglet caché : rien n'avance pendant 1 s…
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const h0 = await tick(page);
  await page.waitForTimeout(1000);
  expect(await tick(page)).toBe(h0);

  // … puis la sim reprend, sans rattraper la seconde passée caché (120 ticks). Deux images après la
  // reprise : la première ne compte aucun temps écoulé, la seconde une image normale.
  const jump = await page.evaluate(() => {
    delete (document as unknown as { visibilityState?: string }).visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
    const start = window.__pdc!.sim().tick;
    return new Promise<number>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(window.__pdc!.sim().tick - start))));
  });
  expect(jump).toBeLessThanOrEqual(6);
  await expect.poll(() => tick(page)).toBeGreaterThan(h0 + 10);

  expect(errors).toEqual([]);
});

test('progression corrompue ou d\'un autre format : le jeu charge et repart de zéro', async ({ page }) => {
  const errors = watchErrors(page);
  const bad = ['{"v":1,"averses":{"1-1":', 'null', '{"v":1,"averses":[3],"met":"tigre","costumes":{"tigre":"x"}}'];
  for (const raw of bad) {
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, raw] as const);
    await open(page, '?debug');
    await expect(page.locator('#map')).toBeVisible();
    await expect(tile(page, '1-1')).toHaveAttribute('data-state', 'open');
    await expect(tile(page, '1-2')).toHaveAttribute('data-state', 'locked');
    await page.locator('#open-carnet').click();
    await expect(page.locator('#carnet-grid [data-state="unknown"]')).toHaveCount(10);
  }
  expect(errors).toEqual([]);
});

test('URL : ?averse= ouvre une averse débloquée seulement ; h1–h3 exigent ?debug', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, '?debug&averse=1-2');
  await expect(page.locator('#map')).toBeVisible(); // 1-2 verrouillée : la carte
  await page.evaluate(() => window.__pdc!.setProgress(JSON.stringify({ v: 1, averses: { '1-1': { stars: 1, score: 9, chain: 3 } } })));
  await expect(tile(page, '1-2')).toHaveAttribute('data-state', 'open');

  await open(page, '?debug&averse=1-2');
  await waitAverse(page, '1-2');
  await expect(page.locator('#map')).toBeHidden();

  // Sans ?debug : pas d'outils, pas d'averse à la main.
  await page.goto('/?averse=h1');
  await expect(page.locator('#map')).toBeVisible();
  expect(await page.evaluate(() => window.__pdc === undefined)).toBe(true);

  await open(page, '?debug');
  await page.evaluate(() => window.__pdc!.resetProgress());
  await expect(tile(page, '1-2')).toHaveAttribute('data-state', 'locked');
  expect(errors).toEqual([]);
});
