import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class ObserverManager {
  observeResize(element: HTMLElement): Observable<ResizeObserverEntry> {
    return new Observable((subscriber) => {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          subscriber.next(entry);
        }
      });
      observer.observe(element);

      return () => observer.disconnect();
    });
  }

  observeIntersection(
    element: HTMLElement,
    options?: IntersectionObserverInit,
  ): Observable<IntersectionObserverEntry> {
    return new Observable((subscriber) => {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          subscriber.next(entry);
        }
      }, options);
      observer.observe(element);

      return () => observer.disconnect();
    });
  }

  observeClassChanges(target: HTMLElement): Observable<void> {
    return new Observable((subscriber) => {
      const observer = new MutationObserver(() => {
        subscriber.next();
      });
      observer.observe(target, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    });
  }
}
