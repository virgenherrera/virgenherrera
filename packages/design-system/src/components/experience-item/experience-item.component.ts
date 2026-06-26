import { Component, ViewEncapsulation, input, computed } from '@angular/core';
import type { DescriptionBlock, ExperienceData } from '@vh/profile';
import { FormatDatePipe } from '../../pipes/format-date.pipe';

export type ExperienceItemVariant = 'full' | 'compact';
export const COMPACT_MAX_DESCRIPTION_LENGTH = 150;
export const COMPACT_MAX_TECHNOLOGIES = 6;

@Component({
  selector: 'vh-experience-item',
  standalone: true,
  imports: [FormatDatePipe],
  templateUrl: './experience-item.component.html',
  styleUrl: './experience-item.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ExperienceItemComponent {
  readonly data = input.required<ExperienceData>();
  readonly variant = input<ExperienceItemVariant>('full');

  protected readonly company = computed(() => this.data().company);
  protected readonly role = computed(() => this.data().role);
  protected readonly startDate = computed(() => this.data().startDate);
  protected readonly endDate = computed(() => this.data().endDate);

  protected readonly descriptionBlocks = computed<DescriptionBlock[]>(() => {
    const blocks = this.data().description;

    if (this.variant() === 'compact') {
      const firstParagraphBlock = blocks.find(
        (block) => block.type === 'paragraph',
      );
      const text = firstParagraphBlock?.lines[0] ?? blocks[0]?.lines[0] ?? '';

      return [{ type: 'paragraph', lines: [this.truncate(text)] }];
    }

    return [...blocks];
  });

  protected readonly visibleTechnologies = computed(() => {
    const techs = this.data().technologies;

    return this.variant() === 'compact'
      ? techs.slice(0, COMPACT_MAX_TECHNOLOGIES)
      : techs;
  });

  protected readonly extraTechnologyCount = computed(() => {
    const total = this.data().technologies.length;

    return this.variant() === 'compact' && total > COMPACT_MAX_TECHNOLOGIES
      ? total - COMPACT_MAX_TECHNOLOGIES
      : 0;
  });

  private truncate(text: string): string {
    if (text.length <= COMPACT_MAX_DESCRIPTION_LENGTH) {
      return text;
    }

    return `${text.slice(0, COMPACT_MAX_DESCRIPTION_LENGTH).trimEnd()}…`;
  }
}
