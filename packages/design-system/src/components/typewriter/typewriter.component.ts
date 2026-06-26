import {
  Component,
  ViewEncapsulation,
  input,
  signal,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';

const enum Phase {
  Typing,
  PauseAfterType,
  Deleting,
  PauseAfterDelete,
}

@Component({
  selector: 'vh-typewriter',
  standalone: true,
  templateUrl: './typewriter.component.html',
  styleUrl: './typewriter.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class TypewriterComponent implements OnInit {
  readonly items = input.required<string[]>();
  readonly typeSpeed = input(80);
  readonly deleteSpeed = input(40);
  readonly pauseAfterType = input(2000);
  readonly pauseAfterDelete = input(400);

  protected readonly displayedText = signal('');

  private currentIndex = 0;
  private charIndex = 0;
  private phase = Phase.Typing;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const words = this.items();
    if (!words.length) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.displayedText.set(words[0]);

      return;
    }

    this.tick();
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  private tick(): void {
    const words = this.items();
    if (!words.length) return;

    const currentWord = words[this.currentIndex % words.length];

    switch (this.phase) {
      case Phase.Typing:
        if (this.charIndex < currentWord.length) {
          this.charIndex++;
          this.displayedText.set(currentWord.slice(0, this.charIndex));
          this.schedule(this.typeSpeed());
        } else {
          this.phase = Phase.PauseAfterType;
          this.schedule(this.pauseAfterType());
        }
        break;

      case Phase.PauseAfterType:
        this.phase = Phase.Deleting;
        this.tick();
        break;

      case Phase.Deleting:
        if (this.charIndex > 0) {
          this.charIndex--;
          this.displayedText.set(currentWord.slice(0, this.charIndex));
          this.schedule(this.deleteSpeed());
        } else {
          this.phase = Phase.PauseAfterDelete;
          this.schedule(this.pauseAfterDelete());
        }
        break;

      case Phase.PauseAfterDelete:
        this.currentIndex = (this.currentIndex + 1) % words.length;
        this.charIndex = 0;
        this.phase = Phase.Typing;
        this.tick();
        break;
    }
  }

  private schedule(delay: number): void {
    this.timerId = setTimeout(() => this.tick(), delay);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
