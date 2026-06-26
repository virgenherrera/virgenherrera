import {
  Directive,
  ElementRef,
  DestroyRef,
  inject,
  afterNextRender,
  input,
} from '@angular/core';

const DEFAULT_MARGIN = 32;
const DESKTOP_BREAKPOINT = 768;

@Directive({
  selector: '[vhStickyScroll]',
  standalone: true,
  host: {
    '[style.position]': '"sticky"',
    '[style.align-self]': '"start"',
  },
})
export class StickyScrollDirective {
  readonly marginTop = input(DEFAULT_MARGIN, {
    alias: 'vhStickyScrollMarginTop',
  });
  readonly marginBottom = input(DEFAULT_MARGIN, {
    alias: 'vhStickyScrollMarginBottom',
  });

  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const element = this.elementRef.nativeElement as HTMLElement;
      let lastScrollY = window.scrollY;
      let currentTop = this.marginTop();

      element.style.top = `${currentTop}px`;

      const onScroll = () => {
        const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

        if (!isDesktop) {
          element.style.top = '';

          return;
        }

        const scrollY = window.scrollY;
        const delta = scrollY - lastScrollY;
        lastScrollY = scrollY;

        const sidebarHeight = element.getBoundingClientRect().height;
        const viewportHeight = window.innerHeight;
        const topMargin = this.marginTop();
        const bottomMargin = this.marginBottom();
        const availableHeight = viewportHeight - topMargin - bottomMargin;

        if (sidebarHeight <= availableHeight) {
          currentTop = topMargin;
          element.style.top = `${currentTop}px`;

          return;
        }

        const minTop = viewportHeight - sidebarHeight - bottomMargin;
        currentTop = Math.min(topMargin, Math.max(minTop, currentTop - delta));
        element.style.top = `${currentTop}px`;
      };

      window.addEventListener('scroll', onScroll, { passive: true });

      const resizeObserver = new ResizeObserver(() => {
        onScroll();
      });
      resizeObserver.observe(element);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        resizeObserver.disconnect();
      });
    });
  }
}
