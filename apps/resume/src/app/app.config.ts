import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { ThemeStoreBase, HUB_ACTIONS } from '@vh/design-system';

import { routes } from './app.routes';
import { ThemeStore } from './stores/theme.store';
import { ThemeToggleAction } from './actions/theme-toggle.action';
import { DownloadPdfAction } from './actions/download-pdf.action';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(),
    { provide: ThemeStoreBase, useExisting: ThemeStore },
    { provide: HUB_ACTIONS, useClass: ThemeToggleAction, multi: true },
    { provide: HUB_ACTIONS, useClass: DownloadPdfAction, multi: true },
  ],
};
