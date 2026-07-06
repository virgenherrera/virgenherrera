import { Component, ViewEncapsulation, input, inject } from '@angular/core';
import {
  ParticleEngine,
  type ParticleCanvasConfig,
} from './particle-engine.service';
import { AnimationScheduler } from './animation-scheduler.service';
import { ObserverManager } from './observer-manager.service';
import { SpatialIndex } from './spatial-index.service';
import { CanvasRenderer } from './canvas-renderer.service';
import { ParticleFactory } from './particle-factory.service';

@Component({
  selector: 'vh-particle-canvas',
  standalone: true,
  templateUrl: './particle-canvas.component.html',
  styleUrl: './particle-canvas.component.css',
  encapsulation: ViewEncapsulation.None,
  providers: [
    ParticleEngine,
    ObserverManager,
    AnimationScheduler,
    SpatialIndex,
    CanvasRenderer,
    ParticleFactory,
  ],
})
export class ParticleCanvasComponent {
  readonly labels = input<string[]>([]);
  readonly config = input<Partial<ParticleCanvasConfig>>({});

  private readonly engine = inject(ParticleEngine);

  constructor() {
    this.engine.boot(this.labels, this.config);
  }
}
