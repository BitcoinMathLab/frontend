import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { addApiOriginToHeaders, normalizeApiBaseUrl } from './runtime-config-lib.mjs';

test('normalizes production and loopback API base URLs', () => {
  assert.equal(
    normalizeApiBaseUrl(' https://api.bitcoinmathlab.com/v1/ '),
    'https://api.bitcoinmathlab.com/v1',
  );
  assert.equal(normalizeApiBaseUrl('http://127.0.0.1:8000/'), 'http://127.0.0.1:8000');
  assert.equal(normalizeApiBaseUrl(''), '');
});

test('rejects unsafe or ambiguous API base URLs', () => {
  for (const value of [
    'javascript:alert(1)',
    'http://api.bitcoinmathlab.com',
    'https://user:secret@api.bitcoinmathlab.com',
    'https://api.bitcoinmathlab.com?environment=production',
  ]) {
    assert.throws(() => normalizeApiBaseUrl(value));
  }
});

test('adds only the API origin to the deployed connect-src directive', async () => {
  const template = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const headers = addApiOriginToHeaders(template, 'https://api.bitcoinmathlab.com/v1');

  assert.match(headers, /connect-src 'self' https:\/\/api\.bitcoinmathlab\.com /);
  assert.doesNotMatch(headers, /api\.bitcoinmathlab\.com\/v1/);
  assert.equal(addApiOriginToHeaders(headers, 'https://api.bitcoinmathlab.com'), headers);
});

test('fails when the security header template loses connect-src', () => {
  assert.throws(
    () => addApiOriginToHeaders('/*\n  X-Frame-Options: DENY\n', 'https://api.bitcoinmathlab.com'),
    /connect-src/,
  );
});
