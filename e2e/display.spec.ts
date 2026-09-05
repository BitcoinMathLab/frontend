import { expect, test } from '@playwright/test';

const GENESIS_HASH = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
const LEGACY_TXID = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';
const P2WPKH_TXID = '1674761a2b5cb6c7ea39ef58483433e8735e732f5d5815c9ef90523a91ed34a6';

test('switches among all object displays and drills into shared details', async ({ page }) => {
  await page.goto('/display');
  await expect(page).toHaveTitle('Bitcoin Object Display — Bitcoin Math Lab');
  await expect(page.getByRole('heading', { name: 'Object Display' })).toBeVisible();
  const tabs = page.getByRole('tablist', { name: 'Bitcoin object type' });
  await expect(tabs.getByRole('tab')).toHaveText(['Block', 'Transaction', 'TxIn', 'TxOut']);
  const objectSelector = page.locator('.object-selector');
  const blockInput = page.getByRole('textbox', { name: /block ID/i });
  await expect(blockInput).toHaveValue(GENESIS_HASH);
  await expect(objectSelector.getByRole('button', { name: /Copy block ID/i })).toBeVisible();
  await expect(objectSelector.getByRole('button', { name: /Paste block ID/i })).toBeVisible();
  await expect(objectSelector.getByRole('button', { name: /Use random block ID/i })).toBeVisible();
  await blockInput.fill('f'.repeat(64));
  await objectSelector.getByRole('button', { name: 'Display' }).click();
  await expect(page.getByRole('alert')).toContainText('not available in the Stage 1 display');
  await objectSelector.getByRole('button', { name: /Use random block ID/i }).click();
  await expect(blockInput).toHaveValue(GENESIS_HASH);
  await expect(page.getByRole('alert')).toBeHidden();
  await objectSelector.getByRole('button', { name: 'Clear' }).click();
  await expect(blockInput).toHaveValue('');
  await objectSelector.getByRole('button', { name: /Use random block ID/i }).click();
  const blockId = page.getByRole('button', { name: /^Block ID/ });
  await expect(blockId).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.details')).toContainText('identifies this block in the blockchain');
  await page.getByRole('button', { name: /^Version/ }).click();
  await expect(page.locator('.details')).toContainText('Header version');
  await blockId.click();
  await expect(page.locator('.details')).toContainText('identifies this block in the blockchain');

  await tabs.getByRole('tab', { name: /Transaction$/ }).click();
  const transactionId = page.getByRole('textbox', { name: /transaction ID/i });
  await expect(transactionId).toHaveValue(LEGACY_TXID);
  await expect(page.getByRole('textbox', { name: /index/i })).toBeHidden();
  await transactionId.fill(P2WPKH_TXID);
  await objectSelector.getByRole('button', { name: 'Display' }).click();
  await expect(page.getByRole('button', { name: /^Transaction ID/ })).toContainText(P2WPKH_TXID);
  await objectSelector.getByRole('button', { name: /Use random transaction ID/i }).click();
  await expect(transactionId).not.toHaveValue(P2WPKH_TXID);

  await transactionId.fill(LEGACY_TXID);
  await objectSelector.getByRole('button', { name: 'Display' }).click();
  const inputs = page.locator('details.field--collection').filter({ hasText: 'Inputs' });
  await inputs.locator(':scope > summary').click();
  const input = inputs.locator('details.collection__member').first();
  await input.locator(':scope > summary').click();
  await input
    .getByRole('button')
    .filter({ has: page.getByText('Input 0 · scriptSig', { exact: true }) })
    .click();
  await expect(page.locator('.details')).toContainText('Byte range42–148');
  await page.getByRole('button', { name: /^Version/ }).click();
  await expect(page.locator('.details')).toContainText('Version');
  await expect(page.locator('.fields > .field')).toHaveCount(5);

  await tabs.getByRole('tab', { name: /TxIn$/ }).click();
  await expect(transactionId).toHaveValue(P2WPKH_TXID);
  const inputIndex = page.getByRole('textbox', { name: 'Input index' });
  await expect(inputIndex).toHaveValue('0');
  const indexBox = await inputIndex.boundingBox();
  const copyBox = await objectSelector
    .getByRole('button', { name: /Copy transaction ID/i })
    .boundingBox();
  expect(indexBox?.x).toBeLessThan(copyBox?.x ?? 0);
  await transactionId.fill(LEGACY_TXID);
  await inputIndex.fill('0');
  await objectSelector.getByRole('button', { name: 'Display' }).click();
  await expect(page.getByText('Input ID')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Previous txid/ })).toBeVisible();
  await objectSelector.getByRole('button', { name: /Use random transaction input/i }).click();
  await expect(transactionId).toHaveValue(P2WPKH_TXID);
  await expect(page.locator('.details')).toContainText('Witness placement');
  await expect(page.locator('.details')).toContainText('Serialized separately after all outputs');

  await tabs.getByRole('tab', { name: /TxOut$/ }).click();
  await expect(page.getByText('Output ID')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Amount/ })).toBeVisible();
  await expect(transactionId).toHaveValue(LEGACY_TXID);
  await expect(page.getByRole('textbox', { name: 'Output index' })).toHaveValue('0');
  await objectSelector.getByRole('button', { name: 'Clear' }).click();
  await expect(transactionId).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Output index' })).toHaveValue('');
  await objectSelector.getByRole('button', { name: /Use random transaction output/i }).click();
  await expect(page.getByText('Script classification')).toBeVisible();
});

test('opens an accessible object modal and navigates to its durable full page route', async ({
  page,
}) => {
  await page.goto('/display');
  const transactions = page
    .locator('details.field--collection')
    .filter({ hasText: 'Transactions' });
  await transactions.locator(':scope > summary').click();
  const opener = transactions.getByRole('button', { name: /Transaction 0/ });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Transaction' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close object display' })).toBeFocused();
  await dialog.getByRole('link', { name: 'Open full page' }).click();
  await expect(page).toHaveURL(/\/display\/transaction\/4a5e1e4b/);
  await expect(page.getByRole('tab', { name: 'Transaction' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.goto('/display');
  await transactions.locator(':scope > summary').click();
  await opener.click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close object display' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('direct fixture routes load and the mobile layout has no page overflow', async ({ page }) => {
  await page.goto(`/display/block/${GENESIS_HASH}`);
  await expect(page.getByRole('button', { name: /^Block ID/ })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/display');
  for (const object of ['Block', 'Transaction', 'TxIn', 'TxOut']) {
    await page.getByRole('tab', { name: new RegExp(`${object}$`) }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  }

  await page.goto(`/display/transaction/${P2WPKH_TXID}/input/0`);
  await expect(page.getByText('Input ID')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Previous txid/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Sequence/ })).not.toContainText('final');
  await expect(page.getByText('Witness placement')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
});
