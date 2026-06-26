import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import type { LanguageData } from '@vh/profile';

@Component({
  selector: 'vh-language-badge',
  standalone: true,
  templateUrl: './language-badge.component.html',
  styleUrl: './language-badge.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class LanguageBadgeComponent {
  readonly data = input.required<LanguageData>();

  protected readonly language = computed(() => this.data().language);
  protected readonly proficiency = computed(() => this.data().proficiency);
}
