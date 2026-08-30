import { expect, Page, test } from '@playwright/test';

const validResponse = {
  api_version: 'v1',
  script_type: 'P2PKH',
  input_index: 0,
  scripts: { unlocking: '51', locking: '76ac', combined: '5176ac' },
  sources: {
    script_sig: { transaction_txid: 'a'.repeat(64), index: 0 },
    script_pubkey: { transaction_txid: 'b'.repeat(64), index: 1 },
  },
  signature: {
    algorithm: 'ECDSA/secp256k1',
    signature_hex: '30signature',
    public_key_hex: '02publickey',
    sighash_type: 1,
    sighash_label: 'SIGHASH_ALL',
    preimage_hex: '01000000preimage01000000',
    digest_hex: 'c'.repeat(64),
    valid: true,
  },
  trace: {
    schema_version: 1,
    script: '5176ac',
    success: true,
    diagnostic: null,
    steps: [
      {
        index: 0,
        opcode: {
          name: 'OP_PUSHBYTES_1',
          value: 1,
          hex: '0x01',
          byte_offset: 0,
          byte_length: 1,
          raw: '51',
          is_push: true,
          push_data: '01',
        },
        stacks: {
          before: { main: { depth: 0, items: [] }, alt: { depth: 0, items: [] } },
          after: { main: { depth: 1, items: ['01'] }, alt: { depth: 0, items: [] } },
        },
        explanation: 'Push the signature onto the main stack.',
        diagnostic: null,
      },
      {
        index: 1,
        opcode: {
          name: 'OP_DUP',
          value: 118,
          hex: '0x76',
          byte_offset: 1,
          byte_length: 1,
          raw: '76',
          is_push: false,
          push_data: null,
        },
        stacks: {
          before: { main: { depth: 1, items: ['01'] }, alt: { depth: 0, items: [] } },
          after: { main: { depth: 2, items: ['01', '01'] }, alt: { depth: 0, items: [] } },
        },
        explanation: 'Duplicate the top stack item.',
        diagnostic: null,
      },
      {
        index: 2,
        opcode: {
          name: 'OP_CHECKSIG',
          value: 172,
          hex: '0xac',
          byte_offset: 2,
          byte_length: 1,
          raw: 'ac',
          is_push: false,
          push_data: null,
        },
        stacks: {
          before: {
            main: { depth: 2, items: ['02publickey', '30signature'] },
            alt: { depth: 0, items: [] },
          },
          after: { main: { depth: 1, items: ['01'] }, alt: { depth: 0, items: [] } },
        },
        explanation: 'Verify the signature against the transaction digest and public key.',
        diagnostic: null,
      },
    ],
  },
};

async function mockTraceApi(page: Page, success = true): Promise<void> {
  await page.route('**/api/v1/traces/p2pkh', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: success
        ? validResponse
        : {
            ...validResponse,
            trace: {
              ...validResponse.trace,
              success: false,
              diagnostic: {
                code: 'false-final-value',
                message: 'The final stack value is false.',
                step_index: 2,
                opcode_name: 'OP_CHECKSIG',
              },
            },
          },
    });
  });
}

test('connects spend elements, parsing, execution, stacks, and signature detail', async ({
  page,
}) => {
  await mockTraceApi(page);
  await page.goto('/visualizer');

  const player = page.getByLabel('Script trace player');
  await expect(page.getByRole('heading', { name: 'Stack visualizer' })).toBeVisible();
  const executionTab = page.getByRole('tab', { name: 'Execution' });
  const signatureTab = page.getByRole('tab', { name: 'Signature' });
  await executionTab.focus();
  await executionTab.press('ArrowRight');
  await expect(signatureTab).toHaveAttribute('aria-selected', 'true');
  await expect(signatureTab).toBeFocused();
  await signatureTab.press('ArrowLeft');
  await expect(executionTab).toHaveAttribute('aria-selected', 'true');
  await expect(executionTab).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Stack flow', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stack state' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Execution', exact: true })).toBeVisible();
  const columnCount = await page
    .locator('.visualizer-grid')
    .evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    );
  expect(columnCount).toBe(2);
  const controlsBox = await page.getByLabel('Playback controls').boundingBox();
  const controlsBarBox = await page.locator('.controls-bar').boundingBox();
  const workspaceBox = await page.locator('.visualizer-grid').boundingBox();
  expect(controlsBox?.y).toBeLessThan(workspaceBox?.y ?? 0);
  expect(
    Math.abs(
      (controlsBox?.x ?? 0) +
        (controlsBox?.width ?? 0) / 2 -
        ((controlsBarBox?.x ?? 0) + (controlsBarBox?.width ?? 0) / 2),
    ),
  ).toBeLessThan(2);
  await expect(page.getByText('Keyboard:', { exact: false })).toHaveCount(0);
  await expect(page.getByText('scriptSig', { exact: true })).toBeVisible();
  await expect(page.getByText('scriptPubKey', { exact: true })).toBeVisible();
  await expect(page.getByText('OP_PUSHBYTES_1')).toBeVisible();
  await expect(page.getByText('DATA (Signature)')).toBeVisible();
  await expect(page.getByText('0x01')).toBeVisible();
  await page.getByText('scriptSig', { exact: true }).hover();
  await expect(page.getByRole('tooltip').first()).toContainText('Original hex');
  await expect(page.getByRole('tooltip').first()).toContainText('51');
  await page.getByRole('button', { name: /scriptSig/ }).click();
  await expect(page.getByRole('dialog')).toContainText('This unlocking script is serialized');
  await expect(page.getByRole('dialog')).toContainText('a'.repeat(64));
  await expect(page.getByRole('dialog')).toContainText('input 1');
  await page.getByRole('button', { name: 'Close script source detail' }).click();
  await page.getByRole('button', { name: /scriptPubKey/ }).click();
  await expect(page.getByRole('dialog')).toContainText('This locking script is serialized');
  await expect(page.getByRole('dialog')).toContainText('b'.repeat(64));
  await expect(page.getByRole('dialog')).toContainText('output 1');
  await page.getByRole('button', { name: 'Close script source detail' }).click();
  await expect(page.getByLabel('Restart trace')).toHaveText('<<');
  await expect(page.getByLabel('Go to result')).toHaveText('>>');
  await expect(page.getByLabel('Signature type')).toHaveValue('p2pkh');
  await expect(page.getByLabel('Execution status')).toContainText('Step 0 of 5');
  await expect(page.getByLabel('Execution status')).toContainText('Ready');
  await expect(page.getByLabel('Main stack')).toContainText('Empty stack');
  await expect(page.getByText('Valid spend', { exact: true })).toHaveCount(0);

  const pushOpcodeButton = page.getByRole('button', { name: 'OP_PUSHBYTES_1' });
  await pushOpcodeButton.click();
  await expect(page.getByRole('dialog')).toContainText('OP_CODE');
  await expect(page.getByRole('dialog')).toContainText('OP_PUSHBYTES_1');
  await expect(page.getByRole('dialog')).toContainText('0x01');
  await expect(page.getByRole('dialog')).toContainText('Push the signature onto the main stack.');
  await page.getByRole('dialog').press('Escape');
  await expect(pushOpcodeButton).toBeFocused();
  await expect(page.getByLabel('Execution status')).toContainText('Step 0 of 5');

  const signatureDataButton = page.getByRole('button', { name: 'DATA (Signature), 1 bytes' });
  await signatureDataButton.click();
  await expect(page.getByRole('dialog')).toContainText('DATA');
  await expect(page.getByRole('dialog')).toContainText('DATA (Signature)');
  await expect(page.getByRole('dialog')).toContainText('DER-encoded ECDSA signature');
  await page.getByRole('dialog').press('Escape');
  await expect(signatureDataButton).toBeFocused();

  const opDupButton = page.getByRole('button', { name: 'OP_DUP' });
  await opDupButton.click();
  const operationDialog = page.getByRole('dialog');
  await expect(operationDialog).toBeFocused();
  await expect(operationDialog).toContainText('OP_CODE');
  await expect(operationDialog).toContainText('Hex');
  await expect(operationDialog).toContainText('Stack effect');
  await expect(page.getByLabel('Execution status')).toContainText('Step 0 of 5');
  await operationDialog.press('Escape');
  await expect(operationDialog).toHaveCount(0);
  await expect(opDupButton).toBeFocused();

  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByLabel('Execution status').getByText('Step 1 of 5')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OP_PUSHBYTES_1', exact: true })).toBeVisible();
  await expect(page.getByLabel('Main stack')).toContainText('Empty stack');
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByLabel('Execution status').getByText('Step 2 of 5')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'STACK PUSH', exact: true })).toBeVisible();
  const stackItem = page.getByRole('button', { name: 'DATA (True), 1 of stack' });
  await expect(stackItem).toBeVisible();
  await stackItem.click();
  await expect(page.getByRole('dialog')).toContainText('STACK ITEM');
  await expect(page.getByRole('dialog')).toContainText('Stack position');
  await expect(page.getByRole('dialog')).toContainText('1');
  await expect(page.getByRole('dialog')).toContainText('Hex');
  await page.getByRole('dialog').press('Escape');
  await expect(stackItem).toBeFocused();
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByLabel('Execution status').getByText('Step 3 of 5')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OP_DUP', exact: true })).toBeVisible();
  await expect(page.getByText('Copy the top stack item and push the duplicate.')).toBeVisible();
  await expect(page.getByLabel('Stack state')).toContainText('after OP_DUP');
  await expect(page.getByLabel('Stack movement').getByText('+ true')).toBeVisible();
  await expect(page.getByLabel('Alt stack')).toHaveCount(0);

  await page.getByRole('button', { name: 'Go to result' }).click();
  await expect(page.getByText('Valid spend', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'STACK VALIDATION', exact: true })).toBeVisible();
  await expect(page.getByText('final stack value is true')).toBeVisible();
  await player.press('ArrowLeft');
  await expect(page.getByLabel('Execution status').getByText('Step 4 of 5')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OP_CHECKSIG', exact: true })).toBeVisible();
  const signatureButton = page.getByRole('button', {
    name: 'Open signature verification detail',
  });
  await signatureButton.click();
  await expect(page.getByRole('tab', { name: 'Signature' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByLabel('Signature walkthrough player')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transaction' })).toBeVisible();
  await expect(page.getByText('Legacy ECDSA · P2PKH')).toBeVisible();
  await page.getByRole('button', { name: 'Next signature step' }).click();
  await expect(page.getByText('Start with the spending transaction')).toBeVisible();
  await expect(page.locator('.transaction-regions article.active')).toHaveCount(2);
  await page.getByRole('button', { name: 'Next signature step' }).click();
  await expect(page.getByText('Insert the previous locking script')).toBeVisible();
  await expect(page.getByText('01000000preimage01000000')).toBeVisible();
  await page.getByRole('button', { name: 'Finish signature walkthrough' }).click();
  await expect(page.getByText('Valid signature')).toBeVisible();
  await expect(page.getByText('30signature')).toBeVisible();
  await expect(page.locator('.verification-pane').getByText('c'.repeat(64))).toBeVisible();
});

test('loads modern witness material without sending it to the legacy trace endpoint', async ({
  page,
}) => {
  const txid = 'd'.repeat(64);
  let traceRequests = 0;
  await page.route('**/api/v1/traces/p2pkh', async (route) => {
    traceRequests += 1;
    await route.fulfill({ contentType: 'application/json', json: validResponse });
  });
  await page.route(`**/api/v1/transactions/${txid}/context`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        transaction_hex: '020000000001',
        spent_outputs: [
          {
            txid: 'e'.repeat(64),
            vout: 2,
            spend_type: 'P2WPKH',
            amount_sats: 42,
            script_pubkey_hex: `0014${'11'.repeat(20)}`,
            script_sig_hex: '',
            witness_hex: ['30signature', '03publickey'],
          },
        ],
      },
    });
  });

  await page.goto('/visualizer');
  await page.getByLabel('Transaction ID').fill(txid);
  await page.getByLabel('Input').fill('0');
  await page.getByRole('button', { name: 'Trace input' }).click();

  await expect(page.getByText('SegWit ECDSA · P2WPKH')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Witness stack' })).toBeVisible();
  await expect(page.getByText('30signature')).toBeVisible();
  await expect(page.getByText('03publickey')).toBeVisible();
  await expect(page.getByText(`0014${'11'.repeat(20)}`)).toBeVisible();
  await expect(page.getByText('Signature walkthrough not yet available for P2WPKH')).toBeVisible();
  expect(traceRequests).toBe(1);
});

test('shows a failed P2PKH result without adding another lesson surface', async ({ page }) => {
  await mockTraceApi(page, false);
  await page.goto('/visualizer');

  await expect(page.getByLabel('Execution status')).toContainText('Ready');
  await expect(page.getByText('Invalid spend', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Go to result' }).click();
  await expect(page.getByText('Invalid spend', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Failure explanation')).toContainText(
    'The final stack value is false.',
  );
  await expect(page.locator('.lesson-list')).toHaveCount(0);
});

test('recovers from an API failure and fits a supported mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let attempts = 0;
  await page.route('**/api/v1/traces/p2pkh', async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({ contentType: 'application/json', json: validResponse });
  });

  await page.goto('/visualizer');
  await expect(page.getByRole('alert')).toContainText('The walkthrough could not load.');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByLabel('Script trace player')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next step' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Execution progress' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('redirects the former lab URL to the minimal visualizer route', async ({ page }) => {
  await mockTraceApi(page);
  await page.goto('/labs/script-visualizer');
  await expect(page).toHaveURL(/\/visualizer$/);
});
