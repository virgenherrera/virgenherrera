import {
  DestroyRef,
  ElementRef,
  Injectable,
  afterNextRender,
  inject,
  type InputSignal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AnimationScheduler } from './animation-scheduler.service';
import { CanvasRenderer } from './canvas-renderer.service';
import { ObserverManager } from './observer-manager.service';
import { ParticleFactory } from './particle-factory.service';
import { SpatialIndex } from './spatial-index.service';

// ─── Tech Debt: RESOLVED (PRs #46, #47) ─────────────────────────────────────
//
// Origin: adversarial review (69 agents, 5 expert panels) on nest-base.
// Performance: levels 1-3 implemented; levels 4-5 evaluated and deferred
// (architecture ready — not beneficial at current scale, verified at 501 particles).
// Architecture: monolith decomposed into 5 injectable services (see providers).
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Float32Array layout: [x, y, vx, vy, intrinsicRadius, colorIndex, z] ────
export const FLOATS_PER_DOT = 7;

// ─── Label animation ─────────────────────────────────────────────────────────
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
  private readonly factory = inject(ParticleFactory);

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

    const result = this.factory.createParticles(
      this.config,
      this.renderer.canvasWidth,
      this.renderer.canvasHeight,
      this.textColor,
    );
    this.dotData = result.dotData;
    this.dotCount = result.dotCount;
    this.dotColors = result.dotColors;
    this.labels = result.labels;

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
      const bitmapInfo = this.factory.createLabelBitmap(
        label.label,
        this.textColor,
      );
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
        this.factory.rescalePositions(
          this.dotData,
          this.dotCount,
          this.labels,
          oldW,
          oldH,
          rect.width,
          rect.height,
        );

        if (!this.running) {
          this.render();
        }
      }),
    );
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
