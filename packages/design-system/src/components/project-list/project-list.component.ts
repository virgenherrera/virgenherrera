import { Component, ViewEncapsulation, input } from '@angular/core';
import type { ProjectData } from '@vh/profile';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { TagComponent } from '../tag/tag.component';

@Component({
  selector: 'vh-project-list',
  standalone: true,
  imports: [ScrollRevealDirective, TagComponent],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ProjectListComponent {
  readonly items = input.required<ProjectData[]>();
  readonly heading = input<string>('Projects & Links');
}
