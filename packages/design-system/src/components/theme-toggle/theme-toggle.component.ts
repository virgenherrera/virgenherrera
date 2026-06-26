import {
  Component,
  ViewEncapsulation,
  signal,
  afterNextRender,
  ElementRef,
  inject,
} from '@angular/core';

@Component({
  selector: 'vh-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ThemeToggleComponent {
  protected readonly isDark = signal(false);

  private readonly elementRef = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      this.detectInitialTheme();
    });
  }

  private detectInitialTheme(): void {
    const host = this.elementRef.nativeElement as HTMLElement;
    this.isDark.set(!!host.closest('.dark'));
  }

  protected toggleTheme(): void {
    const host = this.elementRef.nativeElement as HTMLElement;
    const themeRoot = host.closest('.dark') ?? host.parentElement;
    if (themeRoot) {
      themeRoot.classList.toggle('dark');
      this.isDark.set(themeRoot.classList.contains('dark'));
    }
  }
}
