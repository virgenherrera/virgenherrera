import { Component, ViewEncapsulation, input, inject } from '@angular/core';
import {
  ParticleEngine,
  type ParticleCanvasConfig,
} from './particle-engine.service';

@Component({
  selector: 'vh-particle-canvas',
  standalone: true,
  templateUrl: './particle-canvas.component.html',
  styleUrl: './particle-canvas.component.css',
  encapsulation: ViewEncapsulation.None,
  providers: [ParticleEngine],
})
export class ParticleCanvasComponent {
  readonly labels = input<string[]>([]);
  readonly config = input<Partial<ParticleCanvasConfig>>({});

  private readonly engine = inject(ParticleEngine);

  constructor() {
    this.engine.boot(this.labels, this.config);
  }
}
