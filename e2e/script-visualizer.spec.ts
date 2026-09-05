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

const p2wpkhResponse = {
  ...validResponse,
  script_type: 'P2WPKH',
  scripts: {
    witness: ['30signature01', '03publickey'],
    locking: `0014${'11'.repeat(20)}`,
    script_code: `76a914${'11'.repeat(20)}88ac`,
  },
  sources: {
    witness: { transaction_txid: 'd'.repeat(64), index: 0 },
    script_pubkey: { transaction_txid: 'e'.repeat(64), index: 2 },
  },
  signature: {
    ...validResponse.signature,
    preimage_hex: '02000000bip14301000000',
    hash_prevouts_hex: 'a'.repeat(64),
    hash_sequence_hex: 'b'.repeat(64),
    hash_outputs_hex: 'c'.repeat(64),
    script_code_hex: `1976a914${'11'.repeat(20)}88ac`,
    amount_sats: 42,
  },
  trace: {
    ...validResponse.trace,
    script: `76a914${'11'.repeat(20)}88ac`,
    steps: validResponse.trace.steps.slice(1),
  },
};

const P2MS_TXID = '949591ad468cef5c41656c0a502d9500671ee421fadb590fbc6373000039b693';
const P2MS_PREVIOUS_TXID = '581d30e2a73a2db683ac2f15d53590bd0cd72de52555c2722d9d6a78e9fea510';
const P2MS_TRANSACTION_HEX =
  '010000000110a5fee9786a9d2d72c25525e52dd70cbd9035d5152fac83b62d3aa7e2301d580000000093' +
  '00483045022100af204ef91b8dba5884df50f87219ccef22014c21dd05aa44470d4ed800b7f6e4022042' +
  '8fe058684db1bb2bfb6061bff67048592c574effc217f0d150daedcf36787601483045022100e8547aa2c' +
  '2a2761a5a28806d3ae0d1bbf0aeff782f9081dfea67b86cacb321340220771a166929469c34959daf726a' +
  '2ac0c253f9aff391e58a3c7cb46d8b7e0fdc4801ffffffff0180a21900000000001976a914971802edf585' +
  'cdbc4e57017d6e5142515c1e502888ac00000000';
const P2MS_UNLOCKING_SCRIPT =
  '00483045022100af204ef91b8dba5884df50f87219ccef22014c21dd05aa44470d4ed800b7f6e4022042' +
  '8fe058684db1bb2bfb6061bff67048592c574effc217f0d150daedcf36787601483045022100e8547aa2c' +
  '2a2761a5a28806d3ae0d1bbf0aeff782f9081dfea67b86cacb321340220771a166929469c34959daf726a' +
  '2ac0c253f9aff391e58a3c7cb46d8b7e0fdc4801';
const P2MS_LOCKING_SCRIPT =
  '524104d81fd577272bbe73308c93009eec5dc9fc319fc1ee2e7066e17220a5d47a18314578be2faea34b9' +
  'f1f8ca078f8621acd4bc22897b03daa422b9bf56646b342a24104ec3afff0b2b66e8152e9018fe3be3fc9' +
  '2b30bf886b3487a525997d00fd9da2d012dce5d5275854adc3106572a5d1e12d4211b228429f5a7b2f7b' +
  'a92eb0475bb14104b49b496684b02855bc32f5daefa2e2e406db4418f3b86bca5195600951c7d918cdbe5' +
  'e6d3736ec2abf2dd7610995c3086976b2c0c7b4e459d10b34a316d5a5e753ae';
const P2MS_SIGNATURES = [P2MS_UNLOCKING_SCRIPT.slice(4, 148), P2MS_UNLOCKING_SCRIPT.slice(150)];
const P2MS_PUBLIC_KEYS = [
  P2MS_LOCKING_SCRIPT.slice(4, 134),
  P2MS_LOCKING_SCRIPT.slice(136, 266),
  P2MS_LOCKING_SCRIPT.slice(268, 398),
];
const p2msOpcodes = [
  ['OP_0', '00', false, null, 0],
  ['OP_PUSHBYTES_72', `48${P2MS_SIGNATURES[0]}`, true, P2MS_SIGNATURES[0], 1],
  ['OP_PUSHBYTES_72', `48${P2MS_SIGNATURES[1]}`, true, P2MS_SIGNATURES[1], 74],
  ['OP_2', '52', false, null, 147],
  ['OP_PUSHBYTES_65', `41${P2MS_PUBLIC_KEYS[0]}`, true, P2MS_PUBLIC_KEYS[0], 148],
  ['OP_PUSHBYTES_65', `41${P2MS_PUBLIC_KEYS[1]}`, true, P2MS_PUBLIC_KEYS[1], 214],
  ['OP_PUSHBYTES_65', `41${P2MS_PUBLIC_KEYS[2]}`, true, P2MS_PUBLIC_KEYS[2], 280],
  ['OP_3', '53', false, null, 346],
  ['OP_CHECKMULTISIG', 'ae', false, null, 347],
] as const;
const p2msTraceSteps = (() => {
  let stack: string[] = [];
  return p2msOpcodes.map(([name, raw, isPush, pushData, byteOffset], index) => {
    const before = [...stack];
    if (name === 'OP_0') stack = ['', ...stack];
    else if (isPush && pushData) stack = [pushData, ...stack];
    else if (name === 'OP_2') stack = ['02', ...stack];
    else if (name === 'OP_3') stack = ['03', ...stack];
    else if (name === 'OP_CHECKMULTISIG') stack = ['01'];
    return {
      index,
      opcode: {
        name,
        value: Number.parseInt(raw.slice(0, 2), 16),
        hex: `0x${raw.slice(0, 2)}`,
        byte_offset: byteOffset,
        byte_length: raw.length / 2,
        raw,
        is_push: isPush,
        push_data: pushData,
      },
      stacks: {
        before: { main: { depth: before.length, items: before }, alt: { depth: 0, items: [] } },
        after: { main: { depth: stack.length, items: [...stack] }, alt: { depth: 0, items: [] } },
      },
      explanation:
        name === 'OP_CHECKMULTISIG'
          ? 'Verify two ordered signatures against the three committed public keys.'
          : `Execute ${name}.`,
      diagnostic: null,
    };
  });
})();
const p2msResponse = {
  api_version: 'v1',
  script_type: 'P2MS',
  input_index: 0,
  scripts: {
    unlocking: P2MS_UNLOCKING_SCRIPT,
    locking: P2MS_LOCKING_SCRIPT,
    combined: `${P2MS_UNLOCKING_SCRIPT}${P2MS_LOCKING_SCRIPT}`,
  },
  sources: {
    script_sig: { transaction_txid: P2MS_TXID, index: 0 },
    script_pubkey: { transaction_txid: P2MS_PREVIOUS_TXID, index: 0 },
  },
  multisig: {
    required_signatures: 2,
    total_public_keys: 3,
    signatures: P2MS_SIGNATURES,
    public_keys: P2MS_PUBLIC_KEYS,
    has_null_dummy: true,
  },
  trace: {
    schema_version: 1,
    script: `${P2MS_UNLOCKING_SCRIPT}${P2MS_LOCKING_SCRIPT}`,
    success: true,
    diagnostic: null,
    steps: p2msTraceSteps,
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

test('reveals trace stages progressively and clears the workspace for another trace', async ({
  page,
}) => {
  await mockTraceApi(page);
  await page.goto('/visualizer');

  await expect(page.getByRole('button', { name: 'Trace input' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Random' })).toBeVisible();
  await expect(page.getByLabel('Script trace player')).toHaveCount(0);

  await page.getByRole('button', { name: 'Random' }).click();
  await expect(
    page.getByRole('heading', { name: 'Prepare this input for execution', exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Main stack' })).toBeVisible();
  await expect(page.getByText('Empty', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Playback controls' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await expect(
    page.getByRole('button', { name: 'Open referenced output 1 in the previous transaction' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Open referenced output 1 in the previous transaction' })
    .click();
  await expect(page.getByRole('dialog', { name: 'TxOut quick view' })).toContainText(
    '82,974,043,165 sats · 829.74043165 BTC',
  );
  await page.getByRole('button', { name: 'Close object display' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await expect(
    page.getByRole('region', { name: 'Transaction relationship for script execution' }),
  ).toBeVisible();
  await expect(page.getByRole('group', { name: 'Playback controls' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play' })).toBeFocused();

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByLabel('Script trace player')).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Playback controls' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Clear' })).toHaveCount(0);
  await expect(page.getByLabel('Transaction ID')).toHaveValue('');

  await page.getByRole('button', { name: 'Random' }).click();
  await expect(
    page.getByRole('heading', { name: 'Prepare this input for execution', exact: false }),
  ).toBeVisible();
});

test('verifies a standalone DER signature with transaction-derived context', async ({ page }) => {
  const txid = 'a'.repeat(64);
  const candidate = '3006020101020101';
  let verificationBody: Record<string, unknown> | undefined;
  await mockTraceApi(page);
  await page.route(`**/api/v1/transactions/${txid}/context`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        transaction_hex: '01000000',
        spent_outputs: [
          {
            txid: 'b'.repeat(64),
            vout: 1,
            spend_type: 'P2PKH',
            amount_sats: 42,
            script_pubkey_hex: '76ac',
            script_sig_hex: '51',
            witness_hex: [],
          },
        ],
      },
    });
  });
  await page.route('**/api/v1/signatures/ecdsa/verify', async (route) => {
    verificationBody = route.request().postDataJSON() as Record<string, unknown>;
    const { trace: _trace, ...verificationResponse } = validResponse;
    await route.fulfill({
      contentType: 'application/json',
      json: {
        ...verificationResponse,
        signature: { ...verificationResponse.signature, signature_hex: candidate, valid: false },
      },
    });
  });

  await page.goto('/visualizer');
  await page.getByRole('button', { name: 'Random' }).click();
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await page.getByRole('tab', { name: 'Signature' }).click();
  await expect(page.getByRole('heading', { name: 'Verify a DER signature' })).toBeVisible();
  await expect(page.locator('.transaction-source')).toBeVisible();
  await page.getByLabel('DER signature').fill(candidate);
  await page.getByRole('button', { name: 'Verify DER signature' }).click();
  await expect.poll(() => verificationBody).toBeTruthy();
  expect(verificationBody).toMatchObject({
    transaction_hex: '01000000',
    input_index: 0,
    der_signature_hex: candidate,
    spent_outputs: [{ amount_sats: 42, script_pubkey_hex: '76ac' }],
  });
  await page.getByRole('button', { name: 'Finish signature walkthrough' }).click();
  await expect(page.getByText('Invalid signature')).toBeVisible();
  await expect(page.getByText(candidate)).toBeVisible();
});

test('inspects a deep trace stack without moving the stack top or overflowing mobile', async ({
  page,
}) => {
  const deepItems = ['08', '07', '06', '05', '04', '03', '02', '01'];
  const deepResponse = {
    ...validResponse,
    trace: {
      ...validResponse.trace,
      steps: validResponse.trace.steps.map((step, index) =>
        index === validResponse.trace.steps.length - 1
          ? {
              ...step,
              stacks: {
                ...step.stacks,
                after: {
                  ...step.stacks.after,
                  main: { depth: deepItems.length, items: deepItems },
                },
              },
            }
          : step,
      ),
    },
  };
  await page.route('**/api/v1/traces/p2pkh', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: deepResponse });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visualizer');
  await page.getByRole('button', { name: 'Random' }).click();
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await page.getByRole('button', { name: 'Go to result' }).click();

  const overflow = page.getByRole('button', { name: 'Inspect 2 more items' });
  await expect(overflow).toBeVisible();
  await expect(page.locator('.stack-view__items .stack-item')).toHaveCount(6);
  const firstVisibleItem = await page
    .locator('.stack-view__items .stack-item')
    .first()
    .boundingBox();
  const lastVisibleItem = await page.locator('.stack-view__items .stack-item').last().boundingBox();
  expect(firstVisibleItem?.y).toBeLessThan(lastVisibleItem?.y ?? 0);
  await overflow.click();
  const dialog = page.getByRole('dialog', { name: 'All stack items' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(':scope > div > button')).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'Close all stack items' })).toBeFocused();
  await dialog.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(overflow).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test('connects spend elements, parsing, execution, stacks, and signature detail', async ({
  page,
}) => {
  await mockTraceApi(page);
  await page.goto('/visualizer');

  await expect(page.getByRole('heading', { name: 'Stack visualizer' })).toBeVisible();
  await expect(page.getByLabel('Script trace player')).toHaveCount(0);
  await expect(page.getByText('Prepare this input for execution', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Playback controls' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Random' }).click();
  const player = page.getByLabel('Script trace player');
  await expect(player).toBeVisible();
  await expect(page.getByText('Use its outpoint to find the output being spent.')).toBeVisible();
  await expect(page.getByText('Script preparation', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Playback controls' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Stack flow', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await expect(
    page.getByRole('button', { name: 'Open referenced output 1 in the previous transaction' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await expect(
    page.getByRole('heading', { name: 'Prepare this input for execution', exact: false }),
  ).toHaveCount(0);
  const transactionRelationship = page.getByRole('region', {
    name: 'Transaction relationship for script execution',
  });
  await expect(transactionRelationship).toBeVisible();
  await expect(
    transactionRelationship.getByText('Spending transaction', { exact: false }),
  ).toBeVisible();
  await expect(
    transactionRelationship.getByText('Previous transaction', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText('source:', { exact: false })).toHaveCount(0);
  const contextBox = await page.locator('.execution-context').boundingBox();
  const controlsAfterContext = await page
    .getByRole('group', { name: 'Playback controls', exact: true })
    .boundingBox();
  expect(contextBox?.y).toBeLessThan(controlsAfterContext?.y ?? 0);
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
  const executionCard = page.locator('.right-workspace .execution-pane');
  const mainStackCard = page.locator('.right-workspace app-stack-workbench');
  const executionBox = await executionCard.boundingBox();
  const mainStackBox = await mainStackCard.boundingBox();
  expect(executionBox?.y).toBeLessThan(mainStackBox?.y ?? 0);
  await expect(executionCard.getByLabel('Stack movement')).toBeVisible();
  await expect(mainStackCard.getByLabel('Stack movement')).toHaveCount(0);
  const columnCount = await page
    .locator('.visualizer-grid')
    .evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    );
  expect(columnCount).toBe(2);
  const controlsBox = await page
    .getByRole('group', { name: 'Playback controls', exact: true })
    .boundingBox();
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
  await expect(page.locator('#execution-panel').getByText('0x01')).toBeVisible();
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
  await expect(page.locator('.signature-family')).toHaveText('P2PKH');
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
    name: 'Open signature walkthrough',
  });
  await signatureButton.click();
  await expect(page.getByRole('tab', { name: 'Signature' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByLabel('Signature walkthrough player')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transaction and UTXO' })).toBeVisible();
  await expect(page.getByText('Legacy ECDSA · P2PKH')).toBeVisible();
  await page.getByRole('button', { name: 'Next signature step' }).click();
  await expect(page.getByText('Start with the spending transaction')).toBeVisible();
  await expect(page.locator('.transaction-regions article.active')).toHaveCount(2);
  await page.getByRole('button', { name: 'Next signature step' }).click();
  await expect(page.getByText('Insert the previous locking script')).toBeVisible();
  await expect(page.getByText('01000000preimage01000000')).toBeVisible();
  await page.getByRole('button', { name: 'Finish signature walkthrough' }).click();
  await expect(page.getByText('Valid signature')).toBeVisible();
  await expect(page.locator('.verification-pane').getByText('30signature')).toBeVisible();
  await expect(page.locator('.verification-pane').getByText('c'.repeat(64)).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Execution' }).click();
  await expect(page.getByRole('heading', { name: 'Stack flow', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Find spent output' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Signature' }).click();
  await expect(page.getByText('Valid signature')).toBeVisible();
});

test('loads verified P2WPKH signature and stack walkthroughs', async ({ page }) => {
  const txid = 'd'.repeat(64);
  let traceRequests = 0;
  await page.route('**/api/v1/traces/p2pkh', async (route) => {
    traceRequests += 1;
    await route.fulfill({ contentType: 'application/json', json: validResponse });
  });
  await page.route('**/api/v1/traces/p2wpkh', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: p2wpkhResponse });
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
  const transactionSource = page.locator('.transaction-source');
  await transactionSource.getByLabel('Transaction ID').fill(txid);
  await transactionSource.getByLabel('Input', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Trace input' }).click();

  await expect(page.getByLabel('Script trace player')).toBeVisible();
  await expect(page.getByText('SegWit ECDSA · P2WPKH')).toHaveCount(0);
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await expect(page.getByText('P2PKH scriptCode', { exact: true })).toBeVisible();
  await expect(page.getByText('initializes stack')).toBeVisible();
  await page.getByRole('tab', { name: 'Signature' }).click();
  await expect(page.getByText('SegWit ECDSA · P2WPKH')).toBeVisible();
  await expect(page.getByLabel('Signature walkthrough player')).toBeVisible();
  await expect(
    page.locator('.signature-grid').getByText('30signature', { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.locator('.signature-grid').getByText('03publickey', { exact: false }).first(),
  ).toBeVisible();
  await expect(page.getByText('hashPrevouts', { exact: false })).toBeVisible();
  await expect(page.locator('.signature-grid')).toHaveCSS(
    'grid-template-columns',
    /\d+(?:\.\d+)?px \d+(?:\.\d+)?px/,
  );
  await page.getByRole('button', { name: 'Next signature step' }).click();
  await expect(page.getByText('Commit every previous outpoint')).toBeVisible();
  await page.getByRole('button', { name: 'Finish signature walkthrough' }).click();
  await expect(page.getByText('Valid signature')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.signature-grid')).toHaveCSS(
    'grid-template-columns',
    /\d+(?:\.\d+)?px/,
  );
  const pageWidth = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(pageWidth.document).toBeLessThanOrEqual(pageWidth.viewport);
  expect(traceRequests).toBe(0);
});

test('traces the known historical bare 2-of-3 P2MS spend', async ({ page }) => {
  let p2pkhRequests = 0;
  let p2wpkhRequests = 0;
  let p2msRequest: Record<string, unknown> | undefined;
  await page.route('**/api/v1/traces/p2pkh', async (route) => {
    p2pkhRequests += 1;
    await route.abort();
  });
  await page.route('**/api/v1/traces/p2wpkh', async (route) => {
    p2wpkhRequests += 1;
    await route.abort();
  });
  await page.route('**/api/v1/traces/p2ms', async (route) => {
    p2msRequest = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ contentType: 'application/json', json: p2msResponse });
  });
  await page.route(`**/api/v1/transactions/${P2MS_TXID}/context`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        transaction_hex: P2MS_TRANSACTION_HEX,
        spent_outputs: [
          {
            txid: P2MS_PREVIOUS_TXID,
            vout: 0,
            spend_type: 'P2MS',
            output_type: 'P2MS',
            is_nested: false,
            amount_sats: 1_690_000,
            script_pubkey_hex: P2MS_LOCKING_SCRIPT,
            script_sig_hex: P2MS_UNLOCKING_SCRIPT,
            witness_hex: [],
          },
        ],
      },
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visualizer');
  const source = page.locator('.transaction-source');
  await source.getByLabel('Transaction ID').fill(P2MS_TXID);
  await source.getByLabel('Input', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Trace input' }).click();

  await expect.poll(() => p2msRequest).toBeTruthy();
  expect(p2msRequest).toEqual({
    transaction_hex: P2MS_TRANSACTION_HEX,
    input_index: 0,
    spent_outputs: [{ amount_sats: 1_690_000, script_pubkey_hex: P2MS_LOCKING_SCRIPT }],
  });
  expect(p2pkhRequests).toBe(0);
  expect(p2wpkhRequests).toBe(0);
  await expect(page.getByText('Use its outpoint to find the output being spent.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Playback controls' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page
    .getByRole('button', { name: 'Open referenced output 0 in the previous transaction' })
    .click();
  await expect(page.getByRole('dialog', { name: 'TxOut quick view' })).toContainText(
    P2MS_LOCKING_SCRIPT,
  );
  await page.getByRole('button', { name: 'Close object display' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
  await expect(page.locator('.signature-family')).toHaveText('P2MS');
  await expect(
    page.getByRole('button', { name: 'DATA (CHECKMULTISIG dummy), 0 bytes' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'DATA (Signature 1), 72 bytes' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DATA (Signature 2), 72 bytes' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DATA (Public key 3), 65 bytes' })).toBeVisible();
  await expect(page.getByText('OP_CHECKMULTISIG', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Go to result' }).click();
  await expect(page.getByText('Valid spend', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous step' }).click();
  await expect(page.getByRole('heading', { name: 'OP_CHECKMULTISIG', exact: true })).toBeVisible();
  await expect(
    page.locator('#execution-panel').getByText('historical dummy', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open signature workspace' }).click();
  await expect(
    page.getByRole('heading', { name: 'P2MS signature walkthrough not yet available' }),
  ).toBeVisible();
  await expect(page.getByText('2 of 3', { exact: true })).toBeVisible();
  await expect(page.getByText('Empty NULLDUMMY present', { exact: true })).toBeVisible();
  await expect(page.getByText(P2MS_SIGNATURES[0], { exact: true })).toBeVisible();
  await expect(page.getByText(P2MS_PUBLIC_KEYS[2], { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByLabel('Script trace player')).toHaveCount(0);
  await expect(source.getByLabel('Transaction ID')).toHaveValue('');
});

test('shows a failed P2PKH result without adding another lesson surface', async ({ page }) => {
  await mockTraceApi(page, false);
  await page.goto('/visualizer');

  await page.getByRole('button', { name: 'Random' }).click();
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
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
  await page.getByRole('button', { name: 'Random' }).click();
  await expect(page.getByRole('alert')).toContainText('The walkthrough could not load.');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByLabel('Script trace player')).toBeVisible();
  await page.getByRole('button', { name: 'Find spent output' }).click();
  await page.getByRole('button', { name: 'Assemble execution' }).click();
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
