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

test('loads genesis through the block-zero fallback with coinbase-safe metrics', async ({
  page,
}) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');

  await page.goto('/labs/transaction-explorer');
  await page.getByRole('button', { name: /Genesis coinbase/ }).click();
  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  const summary = page.locator('.summary');
  await expect(summary.locator('div').filter({ hasText: 'Inputs' }).locator('dd')).toHaveText('0');
  await expect(summary.locator('div').filter({ hasText: 'Outputs' }).locator('dd')).toHaveText('1');
  await expect(summary.locator('div').filter({ hasText: 'Format' }).locator('dd')).toHaveText(
    'Coinbase',
  );
  await expect(
    summary.locator('div').filter({ hasText: 'Transaction fee' }).locator('dd'),
  ).toHaveText('Not applicable');
  await expect(summary.locator('div').filter({ hasText: 'Raw size' }).locator('dd')).toHaveText(
    '204 bytes',
  );
  await expect(page.getByText('Fixture verified', { exact: true })).toBeVisible();
});

test('loads native SegWit with distinct identity and rounded virtual size', async ({ page }) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');

  await page.goto('/labs/transaction-explorer');
  await page.getByRole('button', { name: /Native SegWit P2WPKH/ }).click();
  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  const summary = page.locator('.summary');
  await expect(summary.locator('div').filter({ hasText: 'Format' }).locator('dd')).toHaveText(
    'SegWit',
  );
  await expect(summary.locator('div').filter({ hasText: 'Raw size' }).locator('dd')).toHaveText(
    '192 bytes',
  );
  await expect(summary.locator('div').filter({ hasText: 'Virtual size' }).locator('dd')).toHaveText(
    '111 vbytes',
  );
  await expect(summary.locator('div').filter({ hasText: 'Weight' }).locator('dd')).toHaveText(
    '441 WU',
  );
  await expect(
    summary.locator('div').filter({ hasText: 'Transaction fee' }).locator('dd'),
  ).toHaveText('24,400 sats');
  await expect(page.getByText('Fixture verified', { exact: true })).toBeVisible();
});
