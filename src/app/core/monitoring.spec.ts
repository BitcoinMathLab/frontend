import * as Sentry from '@sentry/browser';
import { MonitoringErrorHandler, initializeMonitoring } from './monitoring';

vi.mock('@sentry/browser', () => ({
  captureException: vi.fn(),
  init: vi.fn(),
}));

describe('monitoring', () => {
  afterEach(() => {
    globalThis.__BML_CONFIG__ = undefined;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('initializes Sentry with privacy-conservative defaults', async () => {
    globalThis.__BML_CONFIG__ = {
      apiBaseUrl: '',
      sentryDsn: 'https://public@example.ingest.sentry.io/1',
      environment: 'preview',
      release: 'abc123',
    };

    await expect(initializeMonitoring()).resolves.toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@example.ingest.sentry.io/1',
        environment: 'preview',
        release: 'abc123',
        sendDefaultPii: false,
        tracesSampleRate: 0,
      }),
    );
  });

  it('stays disabled when no Sentry DSN is configured', async () => {
    globalThis.__BML_CONFIG__ = {
      apiBaseUrl: '',
      sentryDsn: '',
      environment: 'test',
      release: '',
    };

    await expect(initializeMonitoring()).resolves.toBe(false);
  });

  it('logs Angular errors locally', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('test failure');

    new MonitoringErrorHandler().handleError(error);

    expect(consoleError).toHaveBeenCalledWith('Unhandled application error', error);
  });
});
