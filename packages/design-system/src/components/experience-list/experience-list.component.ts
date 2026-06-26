import { Component, ViewEncapsulation, input } from '@angular/core';
import type { ExperienceData } from '@vh/profile';
import {
  ExperienceItemComponent,
  type ExperienceItemVariant,
} from '../experience-item/experience-item.component';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'vh-experience-list',
  standalone: true,
  imports: [ExperienceItemComponent, ScrollRevealDirective],
  templateUrl: './experience-list.component.html',
  styleUrl: './experience-list.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ExperienceListComponent {
  readonly items = input.required<ExperienceData[]>();
  readonly heading = input<string>('Experience');
  readonly variant = input<ExperienceItemVariant>('full');
}
