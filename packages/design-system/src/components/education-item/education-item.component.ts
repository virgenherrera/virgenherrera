import { Component, ViewEncapsulation, input, computed } from '@angular/core';
import type { EducationData } from '@vh/profile';

@Component({
  selector: 'vh-education-item',
  standalone: true,
  templateUrl: './education-item.component.html',
  styleUrl: './education-item.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class EducationItemComponent {
  readonly data = input.required<EducationData>();

  protected readonly degree = computed(() => this.data().degree);
  protected readonly translation = computed(
    () => this.data().degreeTranslation,
  );
  protected readonly institution = computed(() => this.data().institution);
  protected readonly location = computed(() => this.data().location);
  protected readonly startYear = computed(() =>
    this.data().startDate.slice(0, 4),
  );
  protected readonly endYear = computed(() =>
    this.data().graduationDate.slice(0, 4),
  );
  protected readonly honors = computed(() => this.data().honors);
}
