import {
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { HubAction, HUB_ACTIONS } from '../../types/hub-action';

type HubPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

@Component({
  selector: 'vh-floating-actions',
  standalone: true,
  templateUrl: './floating-actions.component.html',
  styleUrl: './floating-actions.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FloatingActionsComponent {
  private readonly actions: HubAction[] =
    inject(HUB_ACTIONS, { optional: true }) ?? [];
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly position = input<HubPosition>('top-right');
  protected readonly isExpanded = signal(false);

  protected readonly availableActions = computed(() =>
    [...this.actions].sort((a, b) => a.order - b.order),
  );

  private readonly actionButtons =
    viewChildren<ElementRef<HTMLElement>>('actionBtn');
  protected readonly focusIndex = signal(0);

  protected readonly themeAnnouncement = signal('');
  protected readonly contextAnnouncement = signal('');

  protected get isPassThrough(): boolean {
    return this.availableActions().length <= 1;
  }

  protected handleTriggerClick(): void {
    if (this.isPassThrough) {
      const single = this.availableActions()[0];
      if (single) void single.execute();

      return;
    }
    this.toggleExpand();
  }

  protected toggleExpand(): void {
    const next = !this.isExpanded();
    this.isExpanded.set(next);
    if (next) {
      this.focusIndex.set(0);
      requestAnimationFrame(() => this.focusCurrentItem());
    }
  }

  protected collapse(): void {
    this.isExpanded.set(false);
    const host = this.elementRef.nativeElement as HTMLElement;
    const trigger = host.querySelector<HTMLElement>(
      '.vh-floating-actions__trigger',
    );
    trigger?.focus();
  }

  protected executeAction(action: HubAction): void {
    void action.execute();
    if (action.zone === 'permanent') {
      this.themeAnnouncement.set(action.label());
    }
  }

  protected onActionKeydown(event: KeyboardEvent, index: number): void {
    const actions = this.availableActions();
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.focusIndex.set((index + 1) % actions.length);
        this.focusCurrentItem();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.focusIndex.set((index - 1 + actions.length) % actions.length);
        this.focusCurrentItem();
        break;
      case 'Home':
        event.preventDefault();
        this.focusIndex.set(0);
        this.focusCurrentItem();
        break;
      case 'End':
        event.preventDefault();
        this.focusIndex.set(actions.length - 1);
        this.focusCurrentItem();
        break;
      case 'Escape':
        event.preventDefault();
        this.collapse();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    const host = this.elementRef.nativeElement as HTMLElement;
    if (this.isExpanded() && !host.contains(event.target as Node)) {
      this.isExpanded.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.isExpanded()) {
      this.collapse();
    }
  }

  private focusCurrentItem(): void {
    const buttons = this.actionButtons();
    const btn = buttons[this.focusIndex()];
    if (btn) {
      btn.nativeElement.focus();
    }
  }
}
