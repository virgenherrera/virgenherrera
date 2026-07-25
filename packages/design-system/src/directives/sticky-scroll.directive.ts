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

      /**
       * `align-self: start` opts the sidebar out of the flex container's
       * default `stretch`, which is required on desktop so the sidebar can
       * be measured independently of the main column for sticky offset math.
       * Below the desktop breakpoint the layout stacks (flex-direction:
       * column), so the sidebar must keep the default stretch behavior to
       * fill the available inline size — otherwise it shrinks to a
       * fit-content width that can overflow the viewport.
       */
      const syncLayout = () => {
        const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

        element.style.alignSelf = isDesktop ? 'start' : '';

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

      syncLayout();

      window.addEventListener('scroll', syncLayout, { passive: true });
      window.addEventListener('resize', syncLayout, { passive: true });

      const resizeObserver = new ResizeObserver(() => {
        syncLayout();
      });
      resizeObserver.observe(element);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', syncLayout);
        window.removeEventListener('resize', syncLayout);
        resizeObserver.disconnect();
      });
    });
  }
}
