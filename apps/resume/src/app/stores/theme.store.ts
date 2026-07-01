import {
  Injectable,
  PLATFORM_ID,
  Signal,
  WritableSignal,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemePreference, ThemeStoreBase } from '@vh/design-system';

@Injectable({ providedIn: 'root' })
export class ThemeStore extends ThemeStoreBase {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly systemPrefersDark = signal(false);

  readonly preference: WritableSignal<ThemePreference> =
    signal<ThemePreference>('system');
  readonly isDark: Signal<boolean> = computed(() => {
    const pref = this.preference();
    if (pref === 'dark') return true;
    if (pref === 'light') return false;

    return this.systemPrefersDark();
  });

  constructor() {
    super();

    if (this.isBrowser) {
      const stored = localStorage.getItem('vh-theme-preference');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        this.preference.set(stored);
      }

      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(mq.matches);
      mq.addEventListener('change', (e) => {
        if (this.preference() === 'system') {
          this.systemPrefersDark.set(e.matches);
        }
      });
    }

    afterNextRender(() => {
      const isDarkFromDOM = document.documentElement.classList.contains('dark');
      if (isDarkFromDOM !== this.isDark()) {
        this.systemPrefersDark.set(isDarkFromDOM);
      }
    });

    effect(() => this.applyTheme());
  }

  toggle(): void {
    const current = this.preference();
    this.preference.set(current === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(): void {
    if (!this.isBrowser) return;
    const dark = this.isDark();
    const pref = this.preference();
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vh-theme-preference', pref);
  }
}
