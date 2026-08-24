import { expect, test } from '@playwright/test';

test('keeps the public navigation focused on the five MVP destinations', async ({ page }) => {
  await page.goto('/');

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(navigation.getByRole('link')).toHaveText([
    'Home',
    'Visualizer',
    'Explorer',
    'About',
    'Contact',
  ]);

  for (const removedPath of ['/docs', '/roadmap', '/blog']) {
    await page.goto(removedPath);
    await expect(
      page.getByRole('heading', { name: 'This path is not on the stack.' }),
    ).toBeVisible();
  }
});

test('shows every public destination in the mobile header without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/visualizer');

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(navigation.getByRole('link', { name: 'Contact' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(360);
});
