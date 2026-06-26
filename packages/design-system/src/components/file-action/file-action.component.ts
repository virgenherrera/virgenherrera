import { Component, ViewEncapsulation, input, output } from '@angular/core';
import type { IconName } from '../icon/icon-paths.constant';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'vh-file-action',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './file-action.component.html',
  styleUrl: './file-action.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FileActionComponent {
  readonly icon = input.required<IconName>();
  readonly label = input.required<string>();
  readonly loading = input(false);

  readonly action = output<void>();
}
