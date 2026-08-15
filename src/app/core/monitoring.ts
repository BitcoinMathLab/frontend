import { ErrorHandler, Injectable } from '@angular/core';
import { getRuntimeConfig } from './runtime-config';

type SentryBrowser = typeof import('@sentry/browser');

let sentry: SentryBrowser | undefined;

export async function initializeMonitoring(): Promise<boolean> {
  const config = getRuntimeConfig();

  if (!config.sentryDsn) {
    return false;
  }

  const sdk = await import('@sentry/browser');
  sdk.init({
    dsn: config.sentryDsn,
    environment: config.environment,
    release: config.release || undefined,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      delete event.user;

      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.headers;
        delete event.request.query_string;
      }

      return event;
    },
  });
  sentry = sdk;
  return true;
}

export function captureMonitoringException(error: unknown): void {
  sentry?.captureException(error);
}

@Injectable()
export class MonitoringErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    captureMonitoringException(error);
    console.error('Unhandled application error', error);
  }
}
