import { InjectionToken } from '@angular/core';

import {
  APP_VERSION as VERSION,
  APP_COMMIT_SHA as SHA,
} from './version.generated';

export const APP_VERSION = new InjectionToken<string>('APP_VERSION', {
  providedIn: 'root',
  factory: () => VERSION,
});

export const APP_COMMIT_SHA = new InjectionToken<string>('APP_COMMIT_SHA', {
  providedIn: 'root',
  factory: () => SHA,
});
