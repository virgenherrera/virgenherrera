import {
  Injectable,
  inject,
  ElementRef,
  DestroyRef,
  afterNextRender,
  type InputSignal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AnimationScheduler } from './animation-scheduler.service';
import { ObserverManager } from './observer-manager.service';
import { SpatialIndex } from './spatial-index.service';
import { CanvasRenderer } from './canvas-renderer.service';

// ─── Tech Debt: Performance & Architecture Roadmap ──────────────────────────
//
// Origin: adversarial review (69 agents, 5 expert panels) on nest-base.
// Confirmed 3/32 findings: DI-003, CONN-002, RESIZE-001.
//
// Performance levels:
//   1: distSq comparison in renderConnections ✅ (PR #46)
//   2: Float32Array for positions (stride 7) ✅ (PR #46)
//   3: Spatial hash grid for connections (O(n²) → ~O(n)) ✅
//   4: OffscreenCanvas in Web Worker (render off main thread)
//   5: Object pooling + Path2D batching
//
// Architecture refactor (do alongside levels 3-5):
//   Decompose into focused injectable services. ParticleEngine
//   remains the public facade (black box consumed from outside):
//     - ParticleFactory: creation, pooling, recycling of dots/labels
//     - SpatialIndex: grid/hash for neighbor queries (connections)
//     - CanvasRenderer: ctx operations, DPR scaling, bitmap cache ✅
//     - AnimationScheduler: RAF via animationFrames(), visibility control ✅
//     - ObserverManager: Resize/Intersection/Mutation as Observable factories ✅
//   Each service is independently testable; engine composes them.
//
// Also pending:
//   - Observable factories for browser observers (co-located teardown) ✅
//   - animationFrames() replacing manual RAF loop ✅
//   - Document or fix one-shot InputSignal reads (DI-003) ✅
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Dot animation ───────────────────────────────────────────────────────────
const DOT_MAX_SPEED = 0.4;

// ─── Float32Array layout: [x, y, vx, vy, intrinsicRadius, colorIndex, z] ────
export const FLOATS_PER_DOT = 7;

// ─── Depth & parallax ────────────────────────────────────────────────────────
const DOT_MIN_INTRINSIC = 1;
const DOT_MAX_INTRINSIC = 8;
const DOT_LARGE_PROBABILITY = 0.15;
const DOT_MEDIUM_PROBABILITY = 0.25;

// ─── Label animation ─────────────────────────────────────────────────────────
const LABEL_MAX_SPEED = 0.25;
const LABEL_OFFSCREEN_BUFFER_X = 100;
const LABEL_OFFSCREEN_BUFFER_Y = 30;
const LABEL_REENTRY_OFFSET_X = 50;
const LABEL_REENTRY_OFFSET_Y = 20;

// ─── Text bitmap ─────────────────────────────────────────────────────────────
export const LABEL_FONT = '11px system-ui, sans-serif';
export const LABEL_BITMAP_HEIGHT = 16;
export const LABEL_BITMAP_PADDING = 4;

// ─────────────────────────────────────────────────────────────────────────────

export interface ParticleCanvasConfig {
  readonly labels: string[];
  readonly dotCount: number;
  readonly textCount: number;
  readonly palette: string[];
  readonly connectionDistance: number;
  readonly mobileDotCount: number;
  readonly mobileTextCount: number;
  readonly mobileBreakpoint: number;
}

export const PARTICLE_CANVAS_DEFAULTS: ParticleCanvasConfig = {
  labels: [],
  dotCount: 60,
  textCount: 18,
  palette: [],
  connectionDistance: 120,
  mobileDotCount: 30,
  mobileTextCount: 10,
  mobileBreakpoint: 768,
};

export interface LabelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  color: string;
  bitmap: OffscreenCanvas | null;
  bitmapWidth: number;
  bitmapHeight: number;
}

@Injectable()
export class ParticleEngine {
  // ─── Angular DI ───────────────────────────────────────────────────────────

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly observerManager = inject(ObserverManager);
  private readonly animationScheduler = inject(AnimationScheduler);
  private readonly spatialIndex = inject(SpatialIndex);
  private readonly renderer = inject(CanvasRenderer);

  // ─── State ────────────────────────────────────────────────────────────────

  private canvas!: HTMLCanvasElement;
  private config!: ParticleCanvasConfig;
  private dotData!: Float32Array; // [x, y, vx, vy, intrinsicRadius, colorIndex, z] × dotCount
  private dotColors: string[] = []; // color strings indexed by colorIndex
  private dotCount = 0;
  private labels: LabelParticle[] = [];
  private reducedMotion = false;
  private readonly subscriptions = new Subscription();
  private connectionColorRgb = '139, 92, 246';
  private textColor = 'rgba(100, 116, 139, 0.5)';
  private shadowColor = 'rgba(0, 0, 0, 0.12)';

  private static readonly FALLBACK_PALETTE = [
    'rgba(139, 92, 246, 0.6)',
    'rgba(99, 102, 241, 0.5)',
    'rgba(168, 85, 247, 0.4)',
    'rgba(255, 255, 255, 0.3)',
  ];

  private get running(): boolean {
    return this.animationScheduler.running;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  boot(
    labels: InputSignal<string[]>,
    config: InputSignal<Partial<ParticleCanvasConfig>>,
  ): void {
    afterNextRender(() => {
      const canvas = this.elementRef.nativeElement.querySelector('canvas');
      if (!canvas) return;

      // DI-003: One-shot read — config is immutable after boot
      this.initCanvas(canvas, {
        ...config(),
        labels: labels(),
      });

      this.subscriptions.add(
        this.observerManager
          .observeIntersection(canvas, { threshold: 0.1 })
          .subscribe((entry) => {
            if (entry.isIntersecting) {
              this.start();
            } else {
              this.stop();
            }
          }),
      );

      this.subscriptions.add(
        this.observerManager
          .observeClassChanges(document.documentElement)
          .subscribe(() => this.refreshColors()),
      );
    });

    this.destroyRef.onDestroy(() => this.teardown());
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  private initCanvas(
    canvas: HTMLCanvasElement,
    config: Partial<ParticleCanvasConfig> = {},
  ): void {
    this.canvas = canvas;
    if (!this.renderer.init(canvas)) return;
    this.config = { ...PARTICLE_CANVAS_DEFAULTS, ...config };

    const tokens = this.readCSSTokens();
    if (this.config.palette.length === 0) {
      this.config = {
        ...this.config,
        palette:
          tokens.palette.length > 0
            ? tokens.palette
            : ParticleEngine.FALLBACK_PALETTE,
      };
    }
    this.connectionColorRgb = tokens.lineRgb;
    this.textColor = tokens.textColor;
    this.shadowColor = tokens.shadowColor;

    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer.applyDprScaling(canvas);
    this.createParticles();
    this.observeResize();

    if (this.reducedMotion) {
      this.render();
    }
  }

  private start(): void {
    if (this.running || this.reducedMotion) return;
    this.animationScheduler.start(() => {
      this.updatePositions();
      this.render();
    });
  }

  private stop(): void {
    this.animationScheduler.stop();
  }

  private teardown(): void {
    this.animationScheduler.stop();
    this.subscriptions.unsubscribe();
    this.dotData = new Float32Array(0);
    this.dotColors = [];
    this.labels = [];
  }

  private refreshColors(): void {
    if (!this.canvas) return;

    const tokens = this.readCSSTokens();

    if (tokens.palette.length > 0) {
      this.config = { ...this.config, palette: tokens.palette };
      this.dotColors = [...tokens.palette];
      for (let i = 0; i < this.dotCount; i++) {
        this.dotData[i * FLOATS_PER_DOT + 5] = Math.floor(
          Math.random() * tokens.palette.length,
        );
      }
    }

    this.connectionColorRgb = tokens.lineRgb;
    this.textColor = tokens.textColor;
    this.shadowColor = tokens.shadowColor;

    for (const label of this.labels) {
      label.color =
        tokens.palette.length > 0
          ? tokens.palette[Math.floor(Math.random() * tokens.palette.length)]
          : label.color;
      const bitmapInfo = this.createLabelBitmap(label.label);
      label.bitmap = bitmapInfo.canvas;
      label.bitmapWidth = bitmapInfo.width;
      label.bitmapHeight = bitmapInfo.height;
    }

    if (!this.running) {
      this.render();
    }
  }

  // ─── Animation loop ───────────────────────────────────────────────────────

  private updatePositions(): void {
    const w = this.renderer.canvasWidth;
    const h = this.renderer.canvasHeight;

    for (let i = 0; i < this.dotCount; i++) {
      const base = i * FLOATS_PER_DOT;
      this.dotData[base + 0] += this.dotData[base + 2]; // x += vx
      this.dotData[base + 1] += this.dotData[base + 3]; // y += vy
      if (this.dotData[base + 0] < 0) this.dotData[base + 0] = w;
      if (this.dotData[base + 0] > w) this.dotData[base + 0] = 0;
      if (this.dotData[base + 1] < 0) this.dotData[base + 1] = h;
      if (this.dotData[base + 1] > h) this.dotData[base + 1] = 0;
    }

    for (const label of this.labels) {
      label.x += label.vx;
      label.y += label.vy;
      if (label.x < -LABEL_OFFSCREEN_BUFFER_X)
        label.x = w + LABEL_REENTRY_OFFSET_X;
      if (label.x > w + LABEL_OFFSCREEN_BUFFER_X)
        label.x = -LABEL_REENTRY_OFFSET_X;
      if (label.y < -LABEL_OFFSCREEN_BUFFER_Y)
        label.y = h + LABEL_REENTRY_OFFSET_Y;
      if (label.y > h + LABEL_OFFSCREEN_BUFFER_Y)
        label.y = -LABEL_REENTRY_OFFSET_Y;
    }
  }

  private render(): void {
    this.renderer.clear();
    const dist = this.config.connectionDistance;
    this.spatialIndex.build(this.dotData, this.dotCount, FLOATS_PER_DOT, dist);
    this.renderer.renderConnections(
      this.dotData,
      this.spatialIndex,
      dist,
      this.connectionColorRgb,
    );
    this.renderer.renderDots(
      this.dotData,
      this.dotCount,
      this.dotColors,
      this.shadowColor,
    );
    this.renderer.renderLabels(this.labels, this.textColor);
  }

  // ─── Particle creation ────────────────────────────────────────────────────

  private createParticles(): void {
    const isMobile = window.innerWidth < this.config.mobileBreakpoint;
    const dotCount = isMobile
      ? this.config.mobileDotCount
      : this.config.dotCount;
    const labelCount = isMobile
      ? this.config.mobileTextCount
      : this.config.textCount;

    this.dotCount = dotCount;
    this.dotData = new Float32Array(dotCount * FLOATS_PER_DOT);
    this.dotColors = [...this.config.palette];

    for (let i = 0; i < dotCount; i++) {
      const base = i * FLOATS_PER_DOT;
      const roll = Math.random();
      let intrinsicRadius: number;
      if (roll < DOT_LARGE_PROBABILITY) {
        // ~15% giants (5-8)
        intrinsicRadius = 5 + Math.random() * (DOT_MAX_INTRINSIC - 5);
      } else if (roll < DOT_LARGE_PROBABILITY + DOT_MEDIUM_PROBABILITY) {
        // ~25% medium (3-4)
        intrinsicRadius = 3 + Math.random() * 2;
      } else {
        // ~60% dust (1-2)
        intrinsicRadius = DOT_MIN_INTRINSIC + Math.random();
      }

      this.dotData[base + 0] = Math.random() * this.renderer.canvasWidth; // x
      this.dotData[base + 1] = Math.random() * this.renderer.canvasHeight; // y
      this.dotData[base + 2] = (Math.random() - 0.5) * DOT_MAX_SPEED; // vx
      this.dotData[base + 3] = (Math.random() - 0.5) * DOT_MAX_SPEED; // vy
      this.dotData[base + 4] = intrinsicRadius;
      this.dotData[base + 5] = Math.floor(
        Math.random() * this.dotColors.length,
      ); // colorIndex
      this.dotData[base + 6] = Math.random(); // z
    }

    const configLabels = this.config.labels;
    if (configLabels.length === 0) return;

    this.labels = Array.from({ length: labelCount }, (_, i) => {
      const text = configLabels[i % configLabels.length];
      const bitmapInfo = this.createLabelBitmap(text);

      return {
        x: Math.random() * this.renderer.canvasWidth,
        y: Math.random() * this.renderer.canvasHeight,
        vx: (Math.random() - 0.5) * LABEL_MAX_SPEED,
        vy: (Math.random() - 0.5) * LABEL_MAX_SPEED,
        label: text,
        color:
          this.config.palette[
            Math.floor(Math.random() * this.config.palette.length)
          ],
        bitmap: bitmapInfo.canvas,
        bitmapWidth: bitmapInfo.width,
        bitmapHeight: bitmapInfo.height,
      };
    });
  }

  private createLabelBitmap(label: string): {
    canvas: OffscreenCanvas | null;
    width: number;
    height: number;
  } {
    const dpr = window.devicePixelRatio || 1;
    const h = LABEL_BITMAP_HEIGHT;

    if (typeof OffscreenCanvas === 'undefined') {
      return { canvas: null, width: 0, height: h };
    }

    const measure = new OffscreenCanvas(1, 1);
    const mctx = measure.getContext('2d')!;
    mctx.font = LABEL_FONT;
    const metrics = mctx.measureText(label);
    const w = Math.ceil(metrics.width) + LABEL_BITMAP_PADDING;

    const canvas = new OffscreenCanvas(w * dpr, h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return { canvas: null, width: w, height: h };

    ctx.scale(dpr, dpr);
    ctx.font = LABEL_FONT;
    ctx.fillStyle = this.textColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 2, h / 2);

    return { canvas, width: w, height: h };
  }

  // ─── Canvas management ────────────────────────────────────────────────────

  private observeResize(): void {
    let prevW = this.renderer.canvasWidth;
    let prevH = this.renderer.canvasHeight;

    this.subscriptions.add(
      this.observerManager.observeResize(this.canvas).subscribe(() => {
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width === prevW && rect.height === prevH) return;

        const oldW = prevW;
        const oldH = prevH;
        prevW = rect.width;
        prevH = rect.height;

        this.renderer.applyDprScaling(this.canvas);
        this.rescalePositions(oldW, oldH, rect.width, rect.height);

        if (!this.running) {
          this.render();
        }
      }),
    );
  }

  private rescalePositions(
    oldW: number,
    oldH: number,
    newW: number,
    newH: number,
  ): void {
    const sx = newW / oldW;
    const sy = newH / oldH;

    for (let i = 0; i < this.dotCount; i++) {
      const base = i * FLOATS_PER_DOT;
      this.dotData[base + 0] *= sx; // x
      this.dotData[base + 1] *= sy; // y
    }
    for (const label of this.labels) {
      label.x *= sx;
      label.y *= sy;
    }
  }

  // ─── Theme ────────────────────────────────────────────────────────────────

  private readCSSTokens(): {
    palette: string[];
    lineRgb: string;
    textColor: string;
    shadowColor: string;
  } {
    const style = getComputedStyle(this.canvas);
    const read = (prop: string) => style.getPropertyValue(prop).trim();

    const palette = [
      read('--vh-particle-dot-1'),
      read('--vh-particle-dot-2'),
      read('--vh-particle-dot-3'),
      read('--vh-particle-dot-4'),
    ].filter(Boolean);

    let lineRgb = this.connectionColorRgb;
    const lineToken = read('--vh-particle-line');
    if (lineToken) {
      const match = lineToken.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (match) {
        lineRgb = `${match[1]}, ${match[2]}, ${match[3]}`;
      }
    }

    let textColor = this.textColor;
    const textToken = read('--vh-particle-text');
    if (textToken) {
      textColor = textToken;
    }

    let shadowColor = this.shadowColor;
    const shadowToken = read('--vh-particle-shadow');
    if (shadowToken) {
      shadowColor = shadowToken;
    }

    return { palette, lineRgb, textColor, shadowColor };
  }
}
