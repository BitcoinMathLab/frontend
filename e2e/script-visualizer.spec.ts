import { expect, Page, test } from '@playwright/test';

const validResponse = {
  api_version: 'v1',
  script_type: 'P2PKH',
  input_index: 0,
  scripts: { unlocking: '51', locking: '76ac', combined: '5176ac' },
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

async function mockOpcodeApi(page: Page): Promise<void> {
  await page.route('**/api/v1/traces/opcode', async (route) => {
    const request = route.request().postDataJSON();
    const initial = request.main_stack as string[];
    const beforeDup = [...(request.flow_data as string[])].reverse().concat(initial);
    const top = beforeDup[0];
    const diagnostic = top
      ? null
      : {
          code: 'execution-error',
          message: 'OP_DUP requires one main-stack item.',
          step_index: 0,
          opcode_name: 'OP_DUP',
        };
    await route.fulfill({
      contentType: 'application/json',
      json: {
        api_version: 'v1',
        mode: 'opcode',
        opcode: 'OP_DUP',
        initial_stacks: {
          main: { depth: initial.length, items: initial },
          alt: { depth: request.alt_stack.length, items: request.alt_stack },
        },
        trace: {
          schema_version: 1,
          script: '76',
          success: Boolean(top),
          diagnostic,
          steps: top
            ? [
                {
                  index: 0,
                  opcode: {
                    name: 'OP_DUP',
                    value: 118,
                    hex: '0x76',
                    byte_offset: 0,
                    byte_length: 1,
                    raw: '76',
                    is_push: false,
                    push_data: null,
                  },
                  stacks: {
                    before: {
                      main: { depth: beforeDup.length, items: beforeDup },
                      alt: { depth: request.alt_stack.length, items: request.alt_stack },
                    },
                    after: {
                      main: { depth: beforeDup.length + 1, items: [top, ...beforeDup] },
                      alt: { depth: request.alt_stack.length, items: request.alt_stack },
                    },
                  },
                  explanation: 'Copy the top item.',
                  diagnostic: null,
                },
              ]
            : [],
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
  await expect(page.getByRole('heading', { name: 'Watch Bitcoin Script execute.' })).toBeVisible();
  await expect(page.getByLabel('Loaded transaction context')).toContainText('P2PKH example');
  await expect(page.getByRole('heading', { name: 'Script flow' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stack state' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Execution details' })).toBeVisible();
  await expect(
    page.getByLabel('Loaded transaction context').locator('details'),
  ).not.toHaveAttribute('open', '');
  const columnCount = await page
    .locator('.visualizer-grid')
    .evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    );
  expect(columnCount).toBe(3);
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
  await expect(page.getByText('1 · scriptSig')).toBeVisible();
  await expect(page.getByText('2 · scriptPubKey')).toBeVisible();
  await expect(page.getByText('PUSH signature')).toBeVisible();
  await expect(page.getByLabel('Execution status').getByText('Step 1 of 3')).toBeVisible();
  await expect(page.getByLabel('Execution status')).toContainText('In progress');
  await expect(page.getByText('Valid spend', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByLabel('Execution status').getByText('Step 2 of 3')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OP_DUP', exact: true })).toBeVisible();
  await expect(page.getByText('Copy the top stack item and push the duplicate.')).toBeVisible();
  await expect(page.getByLabel('Stack state')).toContainText('after OP_DUP');
  await expect(page.getByLabel('Stack movement').getByText('+ true')).toBeVisible();
  await expect(page.getByLabel('Alt stack').getByText('empty')).toBeVisible();

  await page.getByRole('button', { name: 'Go to result' }).click();
  await expect(page.getByText('Valid spend', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OP_CHECKSIG', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open signature verification detail' }).click();
  await expect(page.getByRole('dialog')).toContainText('How this signature is verified');
  await expect(page.getByRole('dialog')).toContainText('30signature');
  await page.getByRole('button', { name: 'Close detail' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await player.press('ArrowLeft');
  await expect(page.getByLabel('Execution status').getByText('Step 2 of 3')).toBeVisible();
});

test('shows a failed P2PKH result without adding another lesson surface', async ({ page }) => {
  await mockTraceApi(page, false);
  await page.goto('/visualizer');

  await expect(page.getByText('In progress', { exact: true })).toBeVisible();
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
  await expect(page.getByRole('alert')).toContainText('The trace API is not available.');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByLabel('Script trace player')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next step' })).toBeVisible();

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

test('builds and executes an editable OP_DUP sandbox state', async ({ page }) => {
  await mockTraceApi(page);
  await mockOpcodeApi(page);
  await page.goto('/visualizer');
  await page.getByRole('button', { name: 'OP_DUP sandbox' }).click();

  const sandbox = page.getByLabel('OP_DUP sandbox');
  await expect(sandbox).toContainText('Ready');
  await sandbox.getByLabel('Hex data').fill('aabb');
  await sandbox.getByLabel('Add to').selectOption('flow');
  await sandbox.getByRole('button', { name: 'Add data' }).click();
  await expect(sandbox.getByText('OP_PUSHBYTES_2')).toBeVisible();

  await sandbox.getByLabel('Hex data').fill('cc');
  await sandbox.getByRole('button', { name: 'Add data' }).click();
  await sandbox.getByRole('button', { name: 'OP_PUSHBYTES_1 cc' }).click();
  await expect(page.getByRole('dialog')).toContainText('Script data push');
  await expect(page.getByRole('dialog')).toContainText('01cc');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await sandbox.getByRole('button', { name: 'Move flow item earlier' }).last().click();
  await expect(sandbox.locator('.flow-items article:not(.opcode) strong')).toHaveText([
    'OP_PUSHBYTES_1',
    'OP_PUSHBYTES_2',
  ]);
  await sandbox.getByRole('button', { name: 'Undo' }).click();
  await expect(sandbox.locator('.flow-items article:not(.opcode) strong')).toHaveText([
    'OP_PUSHBYTES_2',
    'OP_PUSHBYTES_1',
  ]);

  await sandbox.getByText('a1b2c3d4', { exact: true }).last().click();
  await expect(page.getByRole('dialog')).toContainText('4 bytes');
  await page.getByRole('button', { name: 'Close data detail' }).click();

  await sandbox.getByRole('button', { name: 'Run OP_DUP' }).click();
  await expect(sandbox).toContainText('Executed');
  await expect(sandbox.getByLabel('Main stack result').locator('.stack-item')).toHaveCount(4);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await sandbox.getByRole('button', { name: 'Reset sandbox' }).click();
  await sandbox.getByRole('button', { name: 'Remove main stack item' }).click();
  await sandbox.getByRole('button', { name: 'Run OP_DUP' }).click();
  await expect(sandbox).toContainText('Stopped');
  await expect(sandbox.getByLabel('Execution diagnostic')).toContainText('execution-error');

  await sandbox.getByRole('button', { name: 'Reset sandbox' }).click();
  await expect(sandbox).toContainText('Ready');
  await expect(sandbox.getByLabel('Execution diagnostic')).toHaveCount(0);
  await expect(sandbox.getByLabel('Main stack result').locator('.stack-item')).toHaveCount(1);

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
