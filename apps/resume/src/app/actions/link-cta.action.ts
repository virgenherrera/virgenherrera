import { Signal, computed, signal } from '@angular/core';
import { HubAction, HubContext } from '@vh/design-system';
import type { LinkData } from '@vh/profile';
import { ProfileStore } from '../stores/profile.store';

export class LinkCtaAction implements HubAction {
  readonly id: string;
  readonly label: Signal<string>;
  readonly icon: Signal<string>;
  readonly zone = 'contextual' as const;
  readonly order: number;
  readonly highlight: Signal<boolean>;

  constructor(
    private readonly link: LinkData,
    private readonly profileStore: ProfileStore,
    index: number,
  ) {
    this.id = `cta-${link.label.toLowerCase()}`;
    this.label = signal(`Connect on ${link.label}`);
    this.icon = signal(link.icon ?? 'link');
    this.order = 10 + index;
    this.highlight = computed(() => !this.profileStore.isPrivateView());
  }

  isAvailable(ctx: HubContext): boolean {
    return !ctx.isPrivateView;
  }

  execute(): void {
    window.open(this.link.url, '_blank', 'noopener,noreferrer');
  }
}
