import { expect, test } from '@playwright/test';

test('lists and opens the foundational project articles', async ({ page }) => {
  await page.goto('/blog');

  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByText('The MVP now runs from trace engine to browser')).toBeVisible();
  await page.getByRole('link', { name: 'Inside the Script Visualizer', exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/inside-script-visualizer$/);
  await expect(page).toHaveTitle('Inside the Script Visualizer — Bitcoin Math Lab');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bitcoinmathlab.com/blog/inside-script-visualizer',
  );
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4);
  await expect(page.getByRole('link', { name: 'Open the visualizer' })).toBeVisible();
});

test('handles an unknown article slug without substituting content', async ({ page }) => {
  await page.goto('/blog/not-a-published-article');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This note is not in the lab.');
  await expect(page.getByRole('link', { name: 'Return to the blog' })).toBeVisible();
  await expect(page.getByText('Why Bitcoin Math Lab?')).toHaveCount(0);
});
