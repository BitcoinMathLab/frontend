import { expect, test } from '@playwright/test';

test('verifies the deployed public shell, metadata, and security headers', async ({ page }) => {
  test.skip(
    !process.env['BML_PRODUCTION_SMOKE'],
    'Set BML_PRODUCTION_SMOKE=1 with BML_E2E_BASE_URL to run the deployment check.',
  );

  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/Bitcoin Math Lab/);
  await expect(page.getByRole('link', { name: 'Try the visualizer' })).toBeVisible();

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bitcoinmathlab.com/',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    /Bitcoin Math Lab/,
  );

  if (new URL(page.url()).protocol === 'https:') {
    const headers = response?.headers() ?? {};
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain('connect-src');
    expect(headers['strict-transport-security']).toBeTruthy();
  }

  await page.goto('/docs');
  await expect(page).toHaveTitle(/Documentation/);
  await expect(
    page.getByRole('heading', { name: 'How Bitcoin Math Lab fits together.' }),
  ).toBeVisible();

  await page.goto('/blog');
  await expect(page).toHaveTitle('Blog — Bitcoin Math Lab');
  await expect(
    page.getByRole('heading', { name: 'Building Bitcoin Math Lab in public.' }),
  ).toBeVisible();
});
