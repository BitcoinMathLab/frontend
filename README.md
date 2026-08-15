# Bitcoin Math Lab Frontend

The public Angular application for Bitcoin Math Lab (BML): interactive tools that make Bitcoin execution visible,
practical, and easier to understand.

The first public MVP is scheduled for October 12, 2026. It will guide visitors through a curated P2PKH spend with
opcode, byte, stack, and failure-state visualization.

## Current scope

The public-site foundation currently includes:

- a strict, standalone Angular 21 application;
- lazy-loaded Home, About, Roadmap, Blog, and Contact routes;
- shared responsive navigation and footer;
- Bitcoin Math Lab brand assets and design tokens;
- keyboard focus, skip-link, reduced-motion, and mobile foundations; and
- unit tests for the application shell and public route contract.

Story 2.3 adds Cloudflare Pages deployment assets, production metadata and security headers, and optional Sentry browser
monitoring. The visualizer and product API are implemented in later stories.

## Requirements

- Node.js 24.14.1
- npm 11.11.0

The dependency lockfile is authoritative. Install with:

    npm ci

## Development

Start the local development server:

    npm start

Then open http://localhost:4200.

## Validation

Run the production build:

    npm run build

Run the unit tests once:

    npm run test:ci

Check formatting:

    npm run format:check

## Production configuration

`npm run build` writes `dist/bitcoin-math-lab/browser/runtime-config.js` after Angular finishes. Cloudflare Pages can
provide these build-time variables:

- `BML_SENTRY_DSN` — the public browser DSN; leave unset to disable monitoring;
- `BML_ENVIRONMENT` — optional override such as `production` or `preview`; and
- `BML_RELEASE` — optional release identifier. Cloudflare's `CF_PAGES_COMMIT_SHA` is used when this is unset.

Monitoring uses the framework-independent Sentry browser SDK because the current Angular-specific SDK does not yet
officially support Angular 21. It sends no default PII, enables neither tracing nor session replay, and removes request
headers, cookies, form data, and query strings before sending events.

## Related repositories

- BitClone engine: https://github.com/BitcoinMathLab/bitclone
- Product backend: https://github.com/BitcoinMathLab/backend
- BML organization: https://github.com/BitcoinMathLab
