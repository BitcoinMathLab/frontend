import { defineConfig } from '@playwright/test';

const webServer = [
  ...(process.env['BML_LIVE_API']
    ? [
        {
          command:
            process.env['BML_BACKEND_COMMAND'] ??
            './.venv/bin/python -m uvicorn bml_backend.app:app --host 127.0.0.1 --port 8000',
          cwd: process.env['BML_BACKEND_CWD'] ?? '../backend',
          url: 'http://127.0.0.1:8000/api/v1/health',
          reuseExistingServer: !process.env['CI'],
          timeout: 120_000,
        },
      ]
    : []),
  {
    command: 'npm start -- --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer,
});
