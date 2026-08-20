import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('dist/bitcoin-math-lab/browser/runtime-config.js');
const isCloudflare = process.env['CF_PAGES'] === '1';
const branch = process.env['CF_PAGES_BRANCH'] ?? '';
const config = {
  apiBaseUrl: process.env['BML_API_BASE_URL'] ?? '',
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
