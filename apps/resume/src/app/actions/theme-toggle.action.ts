import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { HubAction, HubContext } from '@vh/design-system';
import { ThemeStore } from '../stores/theme.store';

@Injectable()
export class ThemeToggleAction implements HubAction {
  private readonly themeStore = inject(ThemeStore);

  readonly id = 'theme-toggle';
  readonly label: Signal<string> = computed(() =>
    this.themeStore.isDark() ? 'Light mode' : 'Dark mode',
  );
  readonly icon: Signal<string> = computed(() =>
    this.themeStore.isDark() ? 'sun' : 'moon',
  );
  readonly zone = 'permanent' as const;
  readonly order = 0;
  readonly highlight = signal(false);

  isAvailable(_ctx: HubContext): boolean {
    return true;
  }

  execute(): void {
    this.themeStore.toggle();
  }
}
