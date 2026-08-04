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
    String(this.data().startDate.year),
  );
  protected readonly endYear = computed(() =>
    String(this.data().graduationDate.year),
  );
  protected readonly honors = computed(() => this.data().honors);
}
