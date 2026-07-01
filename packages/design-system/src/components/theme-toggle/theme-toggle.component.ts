import { Component, ViewEncapsulation, inject } from '@angular/core';
import { ThemeStoreBase } from '../../types/hub-action';

@Component({
  selector: 'vh-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ThemeToggleComponent {
  private readonly store = inject(ThemeStoreBase);
  protected readonly isDark = this.store.isDark;

  protected toggleTheme(): void {
    this.store.toggle();
  }
}
