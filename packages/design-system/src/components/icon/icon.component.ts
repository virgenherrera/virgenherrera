import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { ICON_PATHS, type IconName } from './icon-paths.constant';

@Component({
  selector: 'vh-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly label = input('');

  protected readonly path = computed(() => ICON_PATHS[this.name()]);
}
