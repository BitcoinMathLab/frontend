export interface BmlRuntimeConfig {
  readonly sentryDsn: string;
  readonly environment: string;
  readonly release: string;
}

declare global {
  var __BML_CONFIG__: BmlRuntimeConfig | undefined;
}

const defaultConfig: BmlRuntimeConfig = Object.freeze({
  sentryDsn: '',
  environment: 'local',
  release: '',
});

export function getRuntimeConfig(): BmlRuntimeConfig {
  return globalThis.__BML_CONFIG__ ?? defaultConfig;
}
