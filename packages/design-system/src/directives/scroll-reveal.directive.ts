import {
  Directive,
  ElementRef,
  DestroyRef,
  inject,
  afterNextRender,
} from '@angular/core';

@Directive({
  selector: '[vhScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private observer: IntersectionObserver | null = null;

  constructor() {
    afterNextRender(() => {
      const el = this.elementRef.nativeElement as HTMLElement;
      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      if (prefersReduced) {
        el.classList.add('vh-revealed');

        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              el.classList.add('vh-revealed');
              this.observer?.disconnect();
              this.observer = null;
            }
          }
        },
        { threshold: 0.1 },
      );

      this.observer.observe(el);

      this.destroyRef.onDestroy(() => {
        this.observer?.disconnect();
        this.observer = null;
      });
    });
  }
}
