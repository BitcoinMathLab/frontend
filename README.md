# Bitcoin Math Lab Frontend

The public Angular application for Bitcoin Math Lab (BML): interactive tools that make Bitcoin execution visible,
practical, and easier to understand.

The first public MVP is scheduled for October 12, 2026. It will guide visitors through a curated P2PKH spend with
opcode, byte, stack, and failure-state visualization.

## Current scope

Story 2.1 establishes:

- a strict, standalone Angular 21 application;
- lazy-loaded Home, About, Roadmap, Blog, and Contact routes;
- shared responsive navigation and footer;
- Bitcoin Math Lab brand assets and design tokens;
- keyboard focus, skip-link, reduced-motion, and mobile foundations; and
- unit tests for the application shell and public route contract.

The visualizer, newsletter integration, hosting, analytics, and error monitoring are implemented in later stories.

## Requirements

- Node.js 20.19 or newer, 22.12 or newer, or Node.js 24
- npm 11

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

## Related repositories

- BitClone engine: https://github.com/BitcoinMathLab/bitclone
- Product backend: https://github.com/BitcoinMathLab/backend
- BML organization: https://github.com/BitcoinMathLab
