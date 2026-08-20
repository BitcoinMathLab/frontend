import { expect, Page, test } from '@playwright/test';

const validResponse = {
  api_version: 'v1',
  script_type: 'P2PKH',
  input_index: 0,
  scripts: { unlocking: '51', locking: '76', combined: '5176' },
  trace: {
    schema_version: 1,
    script: '5176',
    success: true,
    diagnostic: null,
    steps: [
      {
        index: 0,
        opcode: {
          name: 'OP_1',
          value: 81,
          hex: '0x51',
          byte_offset: 0,
          byte_length: 1,
          raw: '51',
          is_push: false,
          push_data: null,
        },
        stacks: {
          before: { main: { depth: 0, items: [] }, alt: { depth: 0, items: [] } },
          after: { main: { depth: 1, items: ['01'] }, alt: { depth: 0, items: [] } },
        },
        explanation: 'Push one onto the main stack.',
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
    ],
  },
};

async function mockTraceApi(page: Page): Promise<void> {
  await page.route('**/api/v1/traces/p2pkh', async (route) => {
    const request = route.request().postDataJSON() as { transaction_hex: string };
    const invalidLesson = request.transaction_hex.includes('c333');
    await route.fulfill({
      contentType: 'application/json',
      json: {
        ...validResponse,
        trace: {
          ...validResponse.trace,
          success: !invalidLesson,
          diagnostic: invalidLesson
            ? {
                code: 'false-final-value',
                message: 'The final stack value is false.',
                step_index: 1,
                opcode_name: 'OP_DUP',
              }
            : null,
        },
      },
    });
  });
}

test('steps through the successful lesson with controls and keyboard', async ({ page }) => {
  await mockTraceApi(page);
  await page.goto('/labs/script-visualizer');

  const player = page.getByLabel('Script trace player');
  await expect(player).toBeVisible();
  await expect(page.getByText('Valid spend', { exact: true })).toBeVisible();
  await expect(page.getByText('Step 1 of 2')).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Step 2 of 2')).toBeVisible();
  await expect(page.getByRole('button', { name: /02 OP_DUP/ })).toHaveAttribute(
    'aria-current',
    'step',
  );

  await player.press('ArrowLeft');
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
});

test('explains concept and failing lessons without stale player state', async ({ page }) => {
  await mockTraceApi(page);
  await page.goto('/labs/script-visualizer');

  await page.getByRole('button', { name: /01 · P2PK Before address hashes Context/ }).click();
  await expect(page.getByText('P2PK locks directly to a public key.')).toBeVisible();
  await expect(page.getByLabel('Script trace player')).toHaveCount(0);

  await page.getByRole('button', { name: /03 · P2PKH One changed signature byte Invalid/ }).click();
  await expect(page.getByText('Invalid spend', { exact: true })).toBeVisible();
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
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

  await page.goto('/labs/script-visualizer');
  await expect(page.getByRole('alert')).toContainText('The trace API is not available.');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByLabel('Script trace player')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
