import { expect, Page, test } from '@playwright/test';

const TXID = 'fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4';
const TRANSACTION_HEX =
  '01000000' +
  '01' +
  '00'.repeat(32) +
  'ffffffff' +
  '00' +
  'ffffffff' +
  '02' +
  'e803000000000000' +
  '01' +
  '51' +
  'd007000000000000' +
  '01' +
  '51' +
  '00000000';
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
        transaction_hex: TRANSACTION_HEX,
        version: 1,
        locktime: 0,
        is_segwit: false,
        is_coinbase: false,
        total_input_sats: 5000000000,
        total_output_sats: 5000000000,
        fee_sats: 0,
        size_bytes: 71,
        weight_units: 284,
        virtual_size_vbytes: 71,
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

test('loads a transaction and displays its ordered spend context', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4200',
  });
  await mockTransactionApi(page);
  await page.goto('/explorer');

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
  await expect(page.getByText('71 bytes')).toBeVisible();
  await expect(page.getByText('71 vbytes')).toBeVisible();
  await expect(page.getByText('284 WU')).toBeVisible();
  await expect(page.getByText('Legacy', { exact: true })).toBeVisible();
  const decodedHeader = page.locator('.decoded-fields');
  await expect(decodedHeader.getByText('Version', { exact: true })).toBeVisible();
  await expect(decodedHeader.getByText('Locktime', { exact: true })).toBeVisible();
  await expect(page.getByText('76a91400112288ac')).toBeVisible();
  await expect(page.getByText('P2PKH', { exact: true })).toHaveCount(4);
  await expect(page.getByText('Fixture verified', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Visualize this spend' })).toHaveAttribute(
    'href',
    `/visualizer?txid=${TXID}&input=0`,
  );
  await expect(page.getByRole('heading', { name: 'Transaction byte inspector' })).toBeVisible();
  await page.getByRole('button', { name: /Output 1 amount, bytes/ }).click();
  await expect(page.locator('.byte-detail')).toContainText('1000 sats');
  await page.getByRole('button', { name: 'Next field' }).click();
  await expect(page.locator('.byte-detail')).toContainText('Output 1 locking-script length');
  await page.getByRole('button', { name: 'Locate output 2 bytes' }).click();
  await expect(page.locator('.byte-detail')).toContainText('Output 2 amount');
  const selectedOutputBytes = page.locator('.byte-field--active');
  await selectedOutputBytes.focus();
  await page.keyboard.press('End');
  await expect(page.locator('.byte-detail')).toContainText('Locktime');
  await expect(page.locator('.byte-field').last()).toBeFocused();
  const copyLocktime = page.locator('.byte-detail__title button');
  await copyLocktime.click();
  await expect(copyLocktime).toHaveText('Copied');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('00000000');

  await page.setViewportSize({ width: 390, height: 844 });
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

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
  await page.goto('/explorer');

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

test('discards a pending lookup when the transaction ID changes', async ({ page }) => {
  let releaseRequest: (() => void) | undefined;
  await page.route('**/api/v1/transactions/**', async (route) => {
    if (route.request().url().endsWith('/transactions/examples')) {
      await route.fulfill({ contentType: 'application/json', json: EXAMPLES_RESPONSE });
      return;
    }
    await new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    await route.fulfill({ contentType: 'application/json', json: { txid: TXID } }).catch(() => {});
  });
  await page.goto('/explorer');

  await page.getByRole('button', { name: 'Inspect transaction' }).click();
  await expect(page.getByRole('status')).toContainText('Asking Bitcoin Core');
  await page.getByRole('textbox', { name: 'Transaction ID' }).fill('b'.repeat(64));

  await expect(page.getByRole('status')).toHaveCount(0);
  releaseRequest?.();
  await page.waitForTimeout(100);
  await expect(page.getByRole('heading', { name: 'Transaction context', exact: true })).toHaveCount(
    0,
  );
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
  await page.goto('/explorer');

  await page.getByRole('button', { name: 'Inspect transaction' }).click();

  await expect(page.getByRole('alert')).toContainText('Bitcoin Core is still catching up');
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
