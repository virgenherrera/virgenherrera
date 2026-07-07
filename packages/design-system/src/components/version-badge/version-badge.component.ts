import { Component, ViewEncapsulation, input } from '@angular/core';

@Component({
  selector: 'vh-version-badge',
  standalone: true,
  template: `<div class="vh-version-badge">{{ version() }}</div>`,
  styleUrl: './version-badge.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class VersionBadgeComponent {
  readonly version = input.required<string>();
}
