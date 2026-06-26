import { Component, ViewEncapsulation, input } from '@angular/core';
import { TagComponent } from '../tag/tag.component';

@Component({
  selector: 'vh-skill-group',
  standalone: true,
  imports: [TagComponent],
  templateUrl: './skill-group.component.html',
  styleUrl: './skill-group.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class SkillGroupComponent {
  readonly category = input.required<string>();
  readonly skills = input.required<readonly string[]>();
}
