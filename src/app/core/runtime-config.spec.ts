import { getRuntimeConfig } from './runtime-config';

describe('runtime configuration', () => {
  afterEach(() => {
    globalThis.__BML_CONFIG__ = undefined;
  });

  it('uses safe local defaults when no deployed configuration exists', () => {
    globalThis.__BML_CONFIG__ = undefined;

    expect(getRuntimeConfig()).toEqual({
      apiBaseUrl: '',
      sentryDsn: '',
      environment: 'local',
      release: '',
    });
  });

  it('returns the deployed runtime configuration', () => {
    globalThis.__BML_CONFIG__ = {
      apiBaseUrl: 'https://api.bitcoinmathlab.com',
      sentryDsn: 'https://public@example.ingest.sentry.io/1',
      environment: 'preview',
      release: 'abc123',
    };

    expect(getRuntimeConfig()).toEqual(globalThis.__BML_CONFIG__);
  });
});
