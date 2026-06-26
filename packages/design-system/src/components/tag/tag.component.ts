import { Component, ViewEncapsulation, input } from '@angular/core';

export type TagVariant = 'default' | 'outlined';
export type TagSize = 'sm' | 'md';

@Component({
  selector: 'vh-tag',
  standalone: true,
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class TagComponent {
  readonly label = input.required<string>();
  readonly variant = input<TagVariant>('default');
  readonly size = input<TagSize>('md');
}
