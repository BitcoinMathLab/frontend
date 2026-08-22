import { expect, Page, test } from '@playwright/test';

const TXID = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';

async function mockTransactionApi(page: Page): Promise<void> {
  await page.route('**/api/v1/transactions/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        api_version: 'v1',
        txid: TXID,
        transaction_hex: '01020304',
        is_coinbase: false,
        spent_outputs: [
          {
            txid: 'a'.repeat(64),
            vout: 1,
            amount_sats: 125000,
            script_pubkey_hex: '76a91400112288ac',
            output_type: 'P2SH',
            spend_type: 'P2SH-P2WPKH',
            is_nested: true,
            redeem_script_hex: '001400112233445566778899aabbccddeeff00112233',
          },
        ],
      },
    });
  });
}

test('loads a transaction and displays its ordered spend context', async ({ page }) => {
  await mockTransactionApi(page);
  await page.goto('/labs/transaction-explorer');

  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  await expect(
    page.getByRole('heading', { name: 'Transaction context', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('125,000 sats')).toBeVisible();
  await expect(page.getByText('4 bytes')).toBeVisible();
  await expect(page.getByText('76a91400112288ac')).toBeVisible();
  await expect(page.getByText('P2SH-P2WPKH')).toBeVisible();
});

test('validates transaction IDs before sending a request', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/v1/transactions/**', async (route) => {
    requests += 1;
    await route.abort();
  });
  await page.goto('/labs/transaction-explorer');

  await page.getByRole('textbox', { name: 'Transaction ID' }).fill('not-a-txid');
  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  await expect(page.getByRole('alert')).toContainText('exactly 64 hexadecimal characters');
  expect(requests).toBe(0);
});

test('explains Core availability safely and fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/v1/transactions/**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      json: { detail: { code: 'bitcoin-core-unavailable', message: 'safe API message' } },
    });
  });
  await page.goto('/labs/transaction-explorer');

  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  await expect(page.getByRole('alert')).toContainText('Bitcoin Core is still catching up');
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
