import { test, expect } from '@playwright/test';

test('cat_view counts appearances once across previews, upgrades and resize', async ({ page, baseURL }) => {
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  // Exercise the production-only tag without sending test traffic to Google.
  await page.route('https://www.googletagmanager.com/**', route => route.abort());
  await page.route('https://pawpointer.app/**', async route => {
    if (route.request().url().includes('/photos/')) await gate;
    const response = await route.fetch({ url: route.request().url().replace('https://pawpointer.app', baseURL!) });
    await route.fulfill({ response });
  });
  const views = () => page.evaluate(() => window.dataLayer
    .map(entry => Array.from(entry as IArguments))
    .filter(entry => entry[0] === 'event' && entry[1] === 'cat_view')
    .map(entry => entry[2] as { cat_count: number; photo_id: string; cat_number: number }));

  await page.goto('https://pawpointer.app/');
  await expect(page.locator('.stage')).toHaveAttribute('data-phase', 'waiting');
  expect(await views()).toEqual([]);

  await page.locator('.stage').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.stage')).toHaveAttribute('data-quality', 'preview');
  await expect.poll(async () => (await views()).length).toBe(1);
  const firstId = await page.locator('.stage').getAttribute('data-photo-id');
  expect(await views()).toEqual([{ cat_count: 1, photo_id: firstId, cat_number: 1 }]);

  await page.setViewportSize({ width: 1200, height: 800 });
  release();
  await expect(page.locator('.stage')).toHaveAttribute('data-quality', 'full');
  expect(await views()).toEqual([{ cat_count: 1, photo_id: firstId, cat_number: 1 }]);

  await page.keyboard.press('Space');
  await expect.poll(async () => (await views()).length).toBe(2);
  await expect(page.locator('.stage')).toHaveAttribute('data-quality', 'full');
  const secondId = await page.locator('.stage').getAttribute('data-photo-id');
  expect(await views()).toEqual([
    { cat_count: 1, photo_id: firstId, cat_number: 1 },
    { cat_count: 1, photo_id: secondId, cat_number: 2 },
  ]);

  await page.mouse.move(300, 250);
  await expect(page.locator('.stage')).toHaveAttribute('data-phase', 'tracking');
  expect((await views()).length).toBe(2);
  await expect.poll(async () => (await views()).length).toBe(3);
  await expect(page.locator('.stage')).toHaveAttribute('data-quality', 'full');
  expect((await views()).map(view => view.cat_number)).toEqual([1, 2, 3]);
  expect((await views()).reduce((total, view) => total + view.cat_count, 0)).toBe(3);
});
