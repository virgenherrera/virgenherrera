import { Injectable, Signal, computed, inject } from '@angular/core';
import { HubAction, HubContext, HUB_ACTIONS } from '@vh/design-system';
import { ThemeStore } from './theme.store';
import { ProfileStore } from './profile.store';

@Injectable({ providedIn: 'root' })
export class ActionHubStore {
  private readonly themeStore = inject(ThemeStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly registeredActions =
    inject(HUB_ACTIONS, { optional: true }) ?? [];

  readonly context: Signal<HubContext> = computed(() => ({
    isDark: this.themeStore.isDark(),
    isPrivateView: this.profileStore.isPrivateView(),
  }));

  readonly availableActions: Signal<HubAction[]> = computed(() => {
    const ctx = this.context();

    return [...this.registeredActions]
      .filter((action) => action.isAvailable(ctx))
      .sort((a, b) => a.order - b.order);
  });
}
