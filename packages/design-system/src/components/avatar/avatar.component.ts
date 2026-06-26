import { Component, ViewEncapsulation, input, signal } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'vh-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class AvatarComponent {
  readonly src = input('');
  readonly alt = input('');
  readonly size = input<AvatarSize>('md');
  readonly showGlow = input(true);

  protected readonly imageError = signal(false);

  protected onImageError(): void {
    this.imageError.set(true);
  }
}
