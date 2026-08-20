import { expect, test } from '@playwright/test';

test('runs successful and failing lessons through the real API and engine', async ({ page }) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');

  await page.goto('/labs/script-visualizer');

  const player = page.getByLabel('Script trace player');
  await expect(player).toBeVisible();
  await expect(page.getByText('Valid spend', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Execution timeline').getByRole('button')).toHaveCount(7);
  await expect(page.getByRole('button', { name: /07 OP_CHECKSIG/ })).toBeVisible();

  await page.getByRole('button', { name: /03 · P2PKH One changed signature byte Invalid/ }).click();
  await expect(page.getByText('Invalid spend', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Failure explanation')).toContainText('false-final-value');
  await expect(page.getByLabel('Execution timeline').getByRole('button')).toHaveCount(7);
});
