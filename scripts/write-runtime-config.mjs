import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { addApiOriginToHeaders, normalizeApiBaseUrl } from './runtime-config-lib.mjs';

const outputPath = resolve('dist/bitcoin-math-lab/browser/runtime-config.js');
const headersOutputPath = resolve('dist/bitcoin-math-lab/browser/_headers');
const headersTemplatePath = resolve('public/_headers');
const isCloudflare = process.env['CF_PAGES'] === '1';
const branch = process.env['CF_PAGES_BRANCH'] ?? '';
const config = {
  apiBaseUrl: normalizeApiBaseUrl(process.env['BML_API_BASE_URL'] ?? ''),
  sentryDsn: process.env['BML_SENTRY_DSN'] ?? '',
  environment:
    process.env['BML_ENVIRONMENT'] ??
    (isCloudflare ? (branch === 'main' ? 'production' : 'preview') : 'local'),
  release: process.env['BML_RELEASE'] ?? process.env['CF_PAGES_COMMIT_SHA'] ?? '',
};
const serializedConfig = JSON.stringify(config, null, 2).replaceAll('<', '\\u003c');
const source = `globalThis.__BML_CONFIG__ = Object.freeze(${serializedConfig});\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, source, 'utf8');

const headersTemplate = await readFile(headersTemplatePath, 'utf8');
const headers = addApiOriginToHeaders(headersTemplate, config.apiBaseUrl);
await writeFile(headersOutputPath, headers, 'utf8');
