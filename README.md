# Bitcoin Math Lab Frontend

The public Angular application for Bitcoin Math Lab (BML): interactive tools that make Bitcoin execution visible,
practical, and easier to understand.

The first public MVP is scheduled for October 12, 2026. It will guide visitors through a curated P2PKH spend with
opcode, byte, stack, and failure-state visualization.

## Current scope

The public-site foundation currently includes:

- a strict, standalone Angular 21 application;
- lazy-loaded Home, Visualizer, Explorer, About, and Contact routes;
- shared responsive navigation and footer;
- Bitcoin Math Lab brand assets and design tokens;
- keyboard focus, skip-link, reduced-motion, and mobile foundations; and
- unit tests for the application shell and public route contract.

Story 2.3 adds Cloudflare Pages deployment assets, production metadata and security headers, and optional Sentry browser
monitoring.

The visualizer at `/visualizer` loads one curated P2PKH spend from the Bitcoin Math Lab backend. It starts before
execution with empty stacks, then connects the script flow, semantic main/alternate stacks, and current operation through
playback and keyboard controls. Script elements open focused explanations without moving the trace, and the spend verdict
appears only after the final step.

The transaction explorer at `/explorer` validates a mainnet transaction ID and loads its raw bytes, created and spent
outputs, classifications, value/fee summary, size metrics, and guided byte ranges from the backend's Bitcoin Core
connection. See the
[transaction explorer QA guide](docs/transaction-explorer.md) for setup and story validation.

Public routes publish route-specific descriptions, canonical URLs, and Open Graph/Twitter metadata. Add every new
indexable route to `public/sitemap.xml` when it is introduced.

## Requirements

- Node.js 24.14.1
- npm 11.11.0

The dependency lockfile is authoritative. Install with:

    npm ci

## Development

Start the local development server:

    npm start

Start the sibling backend on `http://127.0.0.1:8000`, then open http://localhost:4200. The development server proxies
`/api` requests to the backend so the browser does not require a development-only CORS policy.

## Validation

Run the production build:

    npm run build

Run the unit tests once:

    npm run test:ci

Install Chromium once and run the browser smoke tests:

    npx playwright install chromium
    npm run test:e2e

Run the live cross-repository browser check against sibling backend and Bitclone checkouts:

    BML_LIVE_API=1 npm run test:e2e

CI installs fresh checkouts of both sibling repositories and includes this live API path in every frontend PR.

Check formatting:

    npm run format:check

## Production configuration

`npm run build` writes `dist/bitcoin-math-lab/browser/runtime-config.js` after Angular finishes. Cloudflare Pages can
provide these build-time variables:

- `BML_SENTRY_DSN` — the public browser DSN; leave unset to disable monitoring;
- `BML_API_BASE_URL` — optional API origin; leave unset when frontend and API share an origin;
- `BML_ENVIRONMENT` — optional override such as `production` or `preview`; and
- `BML_RELEASE` — optional release identifier. Cloudflare's `CF_PAGES_COMMIT_SHA` is used when this is unset.

Monitoring uses the framework-independent Sentry browser SDK because the current Angular-specific SDK does not yet
officially support Angular 21. It sends no default PII, enables neither tracing nor session replay, and removes request
headers, cookies, form data, and query strings before sending events.

The post-build step validates `BML_API_BASE_URL` and adds its origin to the deployed Content Security Policy. Production
API URLs must use HTTPS; HTTP is accepted only for loopback development addresses. Configuration tests run with
`npm run test:config` and in CI.

After deploying both services, run the release smoke check against the public frontend:

    BML_E2E_BASE_URL=https://bitcoinmathlab.com BML_PRODUCTION_SMOKE=1 BML_LIVE_API=1 npm run test:smoke:production

`BML_E2E_BASE_URL` tells Playwright to use an existing deployment instead of starting local servers. The check verifies
public navigation, route metadata, HTTPS security headers, current Visualizer and Explorer entry points, and the P2PKH
walkthrough through the deployed API.

See the [deployment runbook](docs/deployment.md) for Cloudflare Pages configuration, release verification, and rollback.

## Related repositories

- BitClone engine: https://github.com/BitcoinMathLab/bitclone
- Product backend: https://github.com/BitcoinMathLab/backend
- BML organization: https://github.com/BitcoinMathLab
