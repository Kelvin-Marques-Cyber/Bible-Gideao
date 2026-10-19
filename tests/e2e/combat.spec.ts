import { test, expect, type Page } from '@playwright/test';
import { addItem, applyBattleAction, createGame, currentActor, grantXp, serializeSave, startBattle, unlockPura } from '../../src/game';
import type { GameState } from '../../src/game';

const gameUrl = process.env.COMBAT_TEST_URL ?? '/';
const read = (page: Page): Promise<GameState> => page.evaluate(() => (window as any).__GIDEAO__.getState());
const world = (page: Page) => page.evaluate(() => (window as any).__GIDEAO__.getWorld());

/** Fixtures use the real domain and save serializer, not production gameplay shortcuts. */
function encounter(prepareBreak = false): GameState {
  let game = unlockPura(grantXp(createGame(37), 100));
  game = addItem(addItem(game, 'spear'), 'short_sword');
  game = { ...game, stage: 12, region: 'midian', position: { x: 0, z: 9 }, flags: { ...game.flags, intro: true, storyBattle: false } };
  game = startBattle(game, 'captain');
  if (prepareBreak) {
    // Two legal unboosted opening attacks discover bow weakness and accumulate BP.
    game = applyBattleAction(game, 'attack', 'captain-0', undefined, { weapon: 'bow' });
    game = applyBattleAction(game, 'attack', 'captain-0', undefined, { weapon: 'bow' });
    if (currentActor(game)?.id !== 'pura' || game.battle?.units.find(u => u.id === 'captain-0')?.shield !== 3) {
      throw new Error('The legal setup must end with Purá acting against three remaining shields.');
    }
  }
  return game;
}

async function seedSave(page: Page, game: GameState) {
  console.log('Combat fixture: opening', gameUrl);
  // Establish the correct origin without mounting React while the fixture DB is created.
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'document') await route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Saved battle fixture</title>' });
    else await route.continue();
  }, { times: 1 });
  await page.goto(gameUrl);
  await page.evaluate(async snapshot => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('bible-gideao', 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('saves')) request.result.createObjectStore('saves'); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put(snapshot, 'campaign');
      tx.objectStore('saves').delete('campaign-backup');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    localStorage.setItem('bible-gideao-save-v1', snapshot);
    localStorage.removeItem('bible-gideao-save-v1-backup');
  }, serializeSave(game));
  console.log('Combat fixture: persisted, reloading');
  await page.reload();
  await page.getByRole('button', { name: 'Retomar jornada', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Combate tático' })).toBeVisible();
  console.log('Combat fixture: arena visible');
  await page.screenshot({ path: page.viewportSize()!.width <= 850 ? 'test-results/combat-mobile-layout.png' : 'test-results/combat-desktop-layout.png' });
  await expect.poll(async () => (await world(page)).battleStage?.units?.length).toBe(game.battle!.units.length);
}

async function settle(page: Page, oldEventId: number) {
  await expect.poll(async () => (await read(page)).battle?.eventId, { timeout: 60000 }).toBeGreaterThan(oldEventId);
  await expect(page.locator('.combat-screen')).not.toHaveClass(/resolving/, { timeout: 60000 });
  await expect.poll(async () => (await world(page)).battleStage?.animating).toBe(false);
}

async function saveAndReload(page: Page) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /Salvar jornada/ }).click();
  await expect(page.locator('.toast')).toContainText('salva');
  await page.reload();
  await page.getByRole('button', { name: 'Retomar jornada', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Combate tático' })).toBeVisible();
}

async function recordPresentation(page: Page) {
  await page.evaluate(() => {
    const log: { event: string; shield: string }[] = [];
    (window as any).__combatVisualLog = log;
    const section = document.querySelector('.combat-screen')!;
    const observer = new MutationObserver(() => {
      const event = document.querySelector('[data-testid="battle-event"]')?.textContent ?? '';
      const shield = document.querySelector('[data-testid="shield-captain-0"]')?.textContent ?? '';
      if (event && log.at(-1)?.event !== event) log.push({ event, shield });
    });
    observer.observe(section, { childList: true, subtree: true, characterData: true });
    (window as any).__combatVisualObserver = observer;
  });
}

async function chooseBoostedBow(page: Page, touch = false) {
  const press = async (label: string) => {
    const button = page.getByRole('button', { name: label, exact: true });
    if (touch) await button.tap(); else await button.click();
  };
  await press('Selecionar Líder da patrulha');
  // The alternate weapon is real inventory, and changing it does not consume a turn.
  await press('Usar Cajado');
  await expect(page.getByRole('button', { name: 'Usar Cajado', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await press('Usar Arco');
  await press('Aumentar ímpeto');
  await press('Aumentar ímpeto');
  await expect(page.locator('.combat-preview')).toContainText('3 golpes');
  await expect(page.locator('.combat-preview')).toContainText('QUEBRA!');
}

test('observation discovers a weakness and real save recovery preserves combat decisions', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await seedSave(page, encounter());
  await expect(page.getByTestId('weakness-captain-0-spear')).toHaveAttribute('title', 'Fraqueza desconhecida');
  await page.getByRole('button', { name: 'Selecionar Líder da patrulha', exact: true }).click();
  await page.getByRole('button', { name: 'Técnicas', exact: true }).click();
  await page.getByTestId('action-observe').click();
  const oldEventId = (await read(page)).battle!.eventId;
  await page.getByRole('button', { name: 'Confirmar ação', exact: true }).click();
  await expect(page.locator('.combat-screen')).toHaveClass(/resolving/);
  await expect(page.getByRole('button', { name: 'Confirmar ação', exact: true })).toBeDisabled();
  await settle(page, oldEventId);
  await expect(page.getByTestId('weakness-captain-0-spear')).toHaveAttribute('title', 'Fraco contra lança');
  const before = (await read(page)).battle!;
  expect(before.units.find(u => u.id === 'captain-0')!.revealedWeaknesses).toContain('spear');
  await saveAndReload(page);
  const after = (await read(page)).battle!;
  expect(after.units.map(u => ({ id: u.id, hp: u.hp, bp: u.bp, known: u.revealedWeaknesses }))).toEqual(before.units.map(u => ({ id: u.id, hp: u.hp, bp: u.bp, known: u.revealedWeaknesses })));
  expect(after.turnIndex).toBe(before.turnIndex);
  expect(errors).toEqual([]);
});

test('boosted attack presents three distinct hits before Break and keeps the full result after reload', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await seedSave(page, encounter(true));
  const initial = await read(page), oldEventId = initial.battle!.eventId, debugBefore = await world(page);
  expect(debugBefore.battleStage.units.filter((u: any) => u.side === 'enemy').every((u: any) => u.x < 0)).toBe(true);
  expect(debugBefore.battleStage.units.filter((u: any) => u.side === 'ally').every((u: any) => u.x > 0)).toBe(true);
  await chooseBoostedBow(page);
  await recordPresentation(page);
  await page.getByRole('button', { name: 'Confirmar ação', exact: true }).click();
  await expect(page.getByTestId('action-attack')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Aumentar ímpeto', exact: true })).toBeDisabled();
  await expect(page.getByTestId('battle-event')).toContainText('QUEBRA', { timeout: 60000 });
  await page.screenshot({ path: 'docs/screenshots/combat-desktop.png' });
  await settle(page, oldEventId);
  const after = await read(page), battle = after.battle!, captain = battle.units.find(u => u.id === 'captain-0')!;
  const hits = battle.events.filter(event => event.kind === 'hit' && event.actorId === 'pura');
  expect(hits.map(event => event.hitIndex)).toEqual([1, 2, 3]);
  expect(hits.map(event => event.shieldAfter)).toEqual([2, 1, 0]);
  expect(hits.every((event, index) => index === 0 || event.hpAfter! < hits[index - 1].hpAfter!)).toBe(true);
  expect(battle.events.at(-1)?.kind).toBe('break');
  expect(captain.hp).toBeGreaterThan(0); expect(captain.shield).toBe(0);
  expect(captain.brokenUntilRound).toBe(battle.round + 1);
  expect(battle.units.find(u => u.id === 'pura')!.bp).toBe(0);
  const presentation = await page.evaluate(() => (window as any).__combatVisualLog as { event: string; shield: string }[]);
  for (const label of ['GOLPE 1/3', 'GOLPE 2/3', 'GOLPE 3/3', 'QUEBRA']) expect(presentation.some(item => item.event.includes(label)), label).toBe(true);
  expect((await world(page)).battleStage.eventsPlayed).toBeGreaterThan(debugBefore.battleStage.eventsPlayed);
  await saveAndReload(page);
  const resumed = (await read(page)).battle!;
  expect(resumed.units.find(u => u.id === 'captain-0')!.brokenUntilRound).toBe(captain.brokenUntilRound);
  expect(resumed.units.find(u => u.id === 'pura')!.bp).toBe(0);
  await expect(page.getByTestId('shield-captain-0')).toHaveAttribute('aria-label', '0 escudos de 5');
  expect(errors).toEqual([]);
});

test('touch controls choose a weapon and boost on a horizontal phone without overflowing the viewport', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage(), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await seedSave(page, encounter(true));
  await chooseBoostedBow(page, true);
  const oldEventId = (await read(page)).battle!.eventId;
  await page.getByRole('button', { name: 'Confirmar ação', exact: true }).tap();
  await expect(page.getByTestId('battle-event')).toContainText('QUEBRA', { timeout: 60000 });
  await page.screenshot({ path: 'docs/screenshots/combat-mobile.png' });
  await settle(page, oldEventId);
  expect(await page.locator('body').evaluate(element => element.scrollWidth <= innerWidth)).toBe(true);
  const confirm = (await page.getByRole('button', { name: 'Confirmar ação', exact: true }).boundingBox())!;
  expect(confirm.x).toBeGreaterThanOrEqual(0); expect(confirm.x + confirm.width).toBeLessThanOrEqual(845);
  expect(confirm.y).toBeGreaterThanOrEqual(0); expect(confirm.y + confirm.height).toBeLessThanOrEqual(391);
  expect((await read(page)).battle!.units.find(u => u.id === 'captain-0')!.shield).toBe(0);
  expect(errors).toEqual([]); await context.close();
});

test('leaving a completed encounter restores the exploration world and removes the battle arena', async ({ page }) => {
  let game = startBattle(grantXp(createGame(37), 100), 'training');
  while (game.battle?.status === 'active') game = applyBattleAction(game, 'attack', 'raider-0', undefined, { weapon: 'sword', boost: Math.min(3, currentActor(game)!.bp) });
  expect(game.battle?.status).toBe('victory');
  await seedSave(page, game);
  await page.getByRole('button', { name: 'Continuar a jornada', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Combate tático' })).toHaveCount(0);
  await expect.poll(async () => (await world(page)).battle).toBe(false);
  expect((await world(page)).battleStage).toBeNull();
  await expect(page.getByRole('button', { name: 'Interagir', exact: true })).toBeVisible();
});
