import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { Meta, provideClientHydration } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';
import { ThemeStoreBase, HUB_ACTIONS } from '@vh/design-system';

import { routes } from './app.routes';
import { ThemeStore } from './stores/theme.store';
import { ThemeToggleAction } from './actions/theme-toggle.action';
import { DownloadPdfAction } from './actions/download-pdf.action';
import { provideCtaActions } from './actions/cta-actions.provider';
import { APP_VERSION, APP_COMMIT_SHA } from './version.token';
import { ResumeTitleStrategy } from './seo/resume-title.strategy';
import { seoMetaInitializer } from './seo/seo-meta.initializer';
import { socialMetaInitializer } from './seo/social-meta.initializer';
import { structuredDataInitializer } from './seo/structured-data.initializer';

function versionMetaInitializer(): () => void {
  const meta = inject(Meta);
  const version = inject(APP_VERSION);
  const sha = inject(APP_COMMIT_SHA);

  return () => {
    meta.updateTag({ name: 'app-version', content: `${version}+${sha}` });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(),
    { provide: ThemeStoreBase, useExisting: ThemeStore },
    { provide: HUB_ACTIONS, useClass: ThemeToggleAction, multi: true },
    { provide: HUB_ACTIONS, useClass: DownloadPdfAction, multi: true },
    ...provideCtaActions(),
    { provide: TitleStrategy, useClass: ResumeTitleStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: versionMetaInitializer,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: seoMetaInitializer,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: socialMetaInitializer,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: structuredDataInitializer,
      multi: true,
    },
  ],
};
