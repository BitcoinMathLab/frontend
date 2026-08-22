import { expect, Page, test } from '@playwright/test';

const TXID = 'fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4';
const EXAMPLES_RESPONSE = {
  api_version: 'v1',
  examples: [
    {
      slug: 'early-payment-and-change',
      title: 'Early payment and change',
      description: 'Compare one legacy P2PKH input with its payment and change outputs.',
      txid: TXID,
      input_count: 1,
      output_count: 2,
      expected_spend_types: ['P2PKH'],
      concepts: ['P2PKH', 'payment', 'change'],
    },
  ],
};

async function mockTransactionApi(page: Page): Promise<void> {
  await page.route('**/api/v1/transactions/**', async (route) => {
    if (route.request().url().endsWith('/transactions/examples')) {
      await route.fulfill({ contentType: 'application/json', json: EXAMPLES_RESPONSE });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      json: {
        api_version: 'v1',
        txid: TXID,
        wtxid: TXID,
        transaction_hex: '01020304',
        version: 1,
        locktime: 0,
        is_segwit: false,
        is_coinbase: false,
        total_input_sats: 5000000000,
        total_output_sats: 5000000000,
        fee_sats: 0,
        size_bytes: 4,
        weight_units: 16,
        virtual_size_vbytes: 4,
        outputs: [
          {
            vout: 0,
            amount_sats: 556000000,
            script_pubkey_hex: '76a914c398efa9c392ba6013c5e04ee729755ef7f58b3288ac',
            output_type: 'P2PKH',
          },
          {
            vout: 1,
            amount_sats: 4444000000,
            script_pubkey_hex: '76a914948c765a6914d43f2a7ac177da2c2f6b52de3d7c88ac',
            output_type: 'P2PKH',
          },
        ],
        spent_outputs: [
          {
            txid: 'a'.repeat(64),
            vout: 1,
            amount_sats: 125000,
            script_pubkey_hex: '76a91400112288ac',
            output_type: 'P2PKH',
            spend_type: 'P2PKH',
            is_nested: false,
            redeem_script_hex: null,
          },
        ],
      },
    });
  });
}

test('loads a transaction and displays its ordered spend context', async ({ page }) => {
  await mockTransactionApi(page);
  await page.goto('/labs/transaction-explorer');

  await page.getByRole('button', { name: /Early payment and change/ }).click();
  await expect(page.getByRole('textbox', { name: 'Transaction ID' })).toHaveValue(TXID);
  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  await expect(
    page.getByRole('heading', { name: 'Transaction context', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('125,000 sats')).toBeVisible();
  await expect(page.getByText('2 output(s)', { exact: true })).toBeVisible();
  await expect(page.getByText('556,000,000 sats')).toBeVisible();
  await expect(page.getByText('4,444,000,000 sats')).toBeVisible();
  await expect(page.getByText('Transaction fee', { exact: true })).toBeVisible();
  await expect(page.getByText('0 sats', { exact: true })).toBeVisible();
  await expect(page.getByText('76a914948c765a6914d43f2a7ac177da2c2f6b52de3d7c88ac')).toBeVisible();
  await expect(page.getByText('4 bytes')).toBeVisible();
  await expect(page.getByText('4 vbytes')).toBeVisible();
  await expect(page.getByText('16 WU')).toBeVisible();
  await expect(page.getByText('Legacy', { exact: true })).toBeVisible();
  await expect(page.getByText('Version', { exact: true })).toBeVisible();
  await expect(page.getByText('Locktime', { exact: true })).toBeVisible();
  await expect(page.getByText('76a91400112288ac')).toBeVisible();
  await expect(page.getByText('P2PKH', { exact: true })).toHaveCount(4);
  await expect(page.getByText('Fixture verified', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Transaction ID' })).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Transaction context', exact: true })).toHaveCount(
    0,
  );
});

test('validates transaction IDs before sending a request', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/v1/transactions/**', async (route) => {
    if (route.request().url().endsWith('/transactions/examples')) {
      await route.fulfill({ contentType: 'application/json', json: EXAMPLES_RESPONSE });
      return;
    }
    requests += 1;
    await route.abort();
  });
  await page.goto('/labs/transaction-explorer');

  await expect(page.getByRole('button', { name: 'Copy transaction ID' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Paste transaction ID' })).toBeVisible();
  await page.getByRole('button', { name: 'Use random transaction example' }).click();
  await expect(page.getByRole('textbox', { name: 'Transaction ID' })).toHaveValue(/^[0-9a-f]{64}$/);
  expect(requests).toBe(0);

  await page.getByRole('textbox', { name: 'Transaction ID' }).fill('not-a-txid');
  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  await expect(page.getByRole('alert')).toContainText('exactly 64 hexadecimal characters');
  expect(requests).toBe(0);
});

test('explains Core availability safely and fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/v1/transactions/**', async (route) => {
    if (route.request().url().endsWith('/transactions/examples')) {
      await route.fulfill({ contentType: 'application/json', json: EXAMPLES_RESPONSE });
      return;
    }
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
