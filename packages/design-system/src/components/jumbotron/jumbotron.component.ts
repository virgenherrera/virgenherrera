import {
  Component,
  ViewEncapsulation,
  input,
  signal,
  afterNextRender,
  DestroyRef,
  inject,
} from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { TypewriterComponent } from '../typewriter/typewriter.component';
import { ParticleCanvasComponent } from '../particle-canvas/particle-canvas.component';
import type { ParticleCanvasConfig } from '../particle-canvas/particle-engine.service';

@Component({
  selector: 'vh-jumbotron',
  standalone: true,
  imports: [AvatarComponent, TypewriterComponent, ParticleCanvasComponent],
  templateUrl: './jumbotron.component.html',
  styleUrl: './jumbotron.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class JumbotronComponent {
  private static readonly SCROLL_THRESHOLD = 50;

  readonly heading = input.required<string>();
  readonly subtitleItems = input<string[]>([]);
  readonly avatarSrc = input('');
  readonly avatarAlt = input('');
  readonly particleLabels = input<string[]>([]);
  readonly particleConfig = input<Partial<ParticleCanvasConfig>>({});

  protected readonly hasScrolled = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private reducedMotion = false;

  constructor() {
    afterNextRender(() => {
      this.reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      this.setupScrollListener();
    });
  }

  private setupScrollListener(): void {
    const handler = () => {
      this.hasScrolled.set(
        window.scrollY > JumbotronComponent.SCROLL_THRESHOLD,
      );
    };
    window.addEventListener('scroll', handler, { passive: true });
    this.destroyRef.onDestroy(() =>
      window.removeEventListener('scroll', handler),
    );
  }

  protected scrollDown(): void {
    window.scrollTo({
      top: window.innerHeight,
      behavior: this.reducedMotion ? 'auto' : 'smooth',
    });
  }
}
