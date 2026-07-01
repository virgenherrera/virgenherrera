import { InjectionToken, Signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface HubContext {
  readonly isDark: boolean;
  readonly isPrivateView: boolean;
}

export interface HubAction {
  readonly id: string;
  readonly label: Signal<string>;
  readonly icon: Signal<string>;
  readonly zone: 'permanent' | 'contextual';
  readonly order: number;
  isAvailable(ctx: HubContext): boolean;
  execute(): void | Promise<void>;
}

export const HUB_ACTIONS = new InjectionToken<HubAction[]>('HUB_ACTIONS');

export abstract class ThemeStoreBase {
  abstract readonly isDark: Signal<boolean>;
  abstract readonly preference: Signal<ThemePreference>;
  abstract toggle(): void;
}
