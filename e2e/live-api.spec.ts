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

test('loads a catalog example through the real API, Core, and classification engine', async ({
  page,
}) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');

  await page.goto('/labs/transaction-explorer');
  await page.getByRole('button', { name: /Early payment and change/ }).click();
  await expect(page.getByRole('textbox', { name: 'Transaction ID' })).toHaveValue(
    'fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4',
  );
  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  const summary = page.locator('.summary');
  await expect(summary.locator('div').filter({ hasText: 'Inputs' }).locator('dd')).toHaveText('1');
  await expect(summary.locator('div').filter({ hasText: 'Outputs' }).locator('dd')).toHaveText('2');
  await expect(page.getByText('P2PKH', { exact: true })).toHaveCount(4);
  await expect(page.getByText('Fixture verified', { exact: true })).toBeVisible();
  await expect(page.getByText('556,000,000 sats')).toBeVisible();
  await expect(page.getByText('4,444,000,000 sats')).toBeVisible();
});
