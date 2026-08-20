import { expect, test } from '@playwright/test';

test('publishes navigable project documentation on desktop and mobile', async ({ page }) => {
  await page.goto('/docs');

  await expect(page).toHaveTitle('Documentation — Bitcoin Math Lab');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'How Bitcoin Math Lab fits together.',
  );
  await expect(page.getByRole('navigation', { name: 'Documentation contents' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Three repositories, explicit responsibilities.' }),
  ).toBeVisible();
  await expect(page.locator('#faq details')).toHaveCount(5);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole('link', { name: 'Docs', exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
