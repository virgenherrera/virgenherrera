import { Injectable } from '@angular/core';
import { animationFrames, Subscription } from 'rxjs';

@Injectable()
export class AnimationScheduler {
  private subscription: Subscription | null = null;

  start(tick: () => void): void {
    if (this.subscription) return;
    this.subscription = animationFrames().subscribe(() => tick());
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  get running(): boolean {
    return this.subscription !== null && !this.subscription.closed;
  }
}
