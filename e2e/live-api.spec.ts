import { expect, test } from '@playwright/test';

test('runs the curated lesson through the real API and engine', async ({ page }) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');

  await page.goto('/visualizer');
  await page.getByRole('button', { name: 'Random' }).click();

  const player = page.getByLabel('Script trace player');
  await expect(player).toBeVisible();
  await expect(page.getByText('Valid spend', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await page.getByRole('button', { name: 'Go to result' }).click();
  await expect(page.getByText('Valid spend', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'STACK VALIDATION', exact: true })).toBeVisible();
  await page.getByLabel('Script trace player').press('ArrowLeft');
  await expect(page.getByRole('heading', { name: 'OP_CHECKSIG', exact: true })).toBeVisible();
});

test('builds a visualizer trace from a real Explorer transaction input', async ({ page }) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');
  test.skip(
    !process.env['BML_LIVE_CORE'],
    'Set BML_LIVE_CORE=1 when Bitcoin Core RPC is available.',
  );

  const txid = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';
  await page.goto(`/visualizer?txid=${txid}&input=0`);

  await expect(page.getByLabel('Script trace player')).toBeVisible();
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await page.getByRole('button', { name: /scriptSig/ }).click();
  await expect(page.getByRole('dialog')).toContainText(txid);
  await page.getByRole('button', { name: 'Close script source detail' }).click();
  await page.getByRole('button', { name: 'Go to result' }).click();
  await expect(page.getByText('Valid spend', { exact: true })).toBeVisible();
});

test('loads an arbitrary transaction input from the Visualizer source form', async ({ page }) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');
  test.skip(
    !process.env['BML_LIVE_CORE'],
    'Set BML_LIVE_CORE=1 when Bitcoin Core RPC is available.',
  );

  const txid = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';
  await page.goto('/visualizer');
  await page.getByRole('textbox', { name: 'Transaction ID' }).fill(txid);
  await page.getByRole('spinbutton', { name: 'Input' }).fill('0');
  await page.getByRole('button', { name: 'Trace input' }).click();

  await expect(page.getByLabel('Script trace player')).toBeVisible();
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await page.getByRole('button', { name: /scriptSig/ }).click();
  await expect(page.getByRole('dialog')).toContainText(txid);
});

test('traces the historical bare P2MS input through Core and Bitclone', async ({ page }) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');
  test.skip(
    !process.env['BML_LIVE_CORE'],
    'Set BML_LIVE_CORE=1 when Bitcoin Core RPC is available.',
  );

  const txid = '949591ad468cef5c41656c0a502d9500671ee421fadb590fbc6373000039b693';
  await page.goto('/visualizer');
  await page.getByRole('textbox', { name: 'Transaction ID' }).fill(txid);
  await page.getByRole('spinbutton', { name: 'Input' }).fill('0');
  await page.getByRole('button', { name: 'Trace input' }).click();

  await expect(page.getByLabel('Script trace player')).toBeVisible();
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await expect(page.locator('.signature-family')).toHaveText('P2MS');
  await expect(page.getByText('OP_CHECKMULTISIG', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Go to result' }).click();
  await expect(page.getByText('Valid spend', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Signature' }).click();
  await expect(
    page.getByRole('heading', { name: 'P2MS signature walkthrough not yet available' }),
  ).toBeVisible();
  await expect(page.getByText('2 of 3', { exact: true })).toBeVisible();
});

test('loads an Explorer transaction through the real API, Core, and classification engine', async ({
  page,
}) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');
  test.skip(
    !process.env['BML_LIVE_CORE'],
    'Set BML_LIVE_CORE=1 when Bitcoin Core RPC is available.',
  );

  await page.goto('/explorer');
  await page
    .getByRole('textbox', { name: 'Transaction ID' })
    .fill('fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4');
  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  const summary = page.locator('.summary');
  await expect(summary.locator('div').filter({ hasText: 'Inputs' }).locator('dd')).toHaveText('1');
  await expect(summary.locator('div').filter({ hasText: 'Outputs' }).locator('dd')).toHaveText('2');
  await expect(page.getByText('P2PKH', { exact: true })).toHaveCount(4);
  await expect(page.getByText('556,000,000 sats')).toBeVisible();
  await expect(page.getByText('4,444,000,000 sats')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transaction byte inspector' })).toBeVisible();
  await page.getByRole('button', { name: 'Locate output 2 bytes' }).click();
  await expect(page.locator('.byte-detail')).toContainText('4444000000 sats');
});

test('loads genesis through the block-zero fallback with coinbase-safe metrics', async ({
  page,
}) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');
  test.skip(
    !process.env['BML_LIVE_CORE'],
    'Set BML_LIVE_CORE=1 when Bitcoin Core RPC is available.',
  );

  await page.goto('/explorer');
  await page
    .getByRole('textbox', { name: 'Transaction ID' })
    .fill('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b');
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
  await page.getByRole('button', { name: /Input 1 previous output index, bytes/ }).click();
  await expect(page.locator('.byte-detail')).toContainText('coinbase marker');
  await expect(page.getByText('Fixture verified', { exact: true })).toBeVisible();
});

test('loads native SegWit with distinct identity and rounded virtual size', async ({ page }) => {
  test.skip(!process.env['BML_LIVE_API'], 'Set BML_LIVE_API=1 to run the cross-repository check.');
  test.skip(
    !process.env['BML_LIVE_CORE'],
    'Set BML_LIVE_CORE=1 when Bitcoin Core RPC is available.',
  );

  await page.goto('/explorer');
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
  await expect(page.getByRole('button', { name: /SegWit marker and flag, bytes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Input 1 witness item 2, bytes/ })).toBeVisible();
  await expect(page.getByText('Fixture verified', { exact: true })).toBeVisible();
});
