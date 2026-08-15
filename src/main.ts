import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeMonitoring } from './app/core/monitoring';

initializeMonitoring()
  .catch((error: unknown) => console.error('Monitoring initialization failed', error))
  .finally(() => {
    bootstrapApplication(App, appConfig).catch((error: unknown) =>
      console.error('Application bootstrap failed', error),
    );
  });
