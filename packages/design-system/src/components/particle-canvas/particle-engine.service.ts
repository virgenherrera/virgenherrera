import {
  Injectable,
  inject,
  ElementRef,
  DestroyRef,
  afterNextRender,
  type InputSignal,
} from '@angular/core';

// ─── Tech Debt: Performance & Architecture Roadmap ──────────────────────────
//
// Current: Level 0 — single monolithic service, brute-force loops,
// ~0.2ms/frame at 60 dots (1.2% of 16.67ms budget).
//
// Performance levels:
//   1: distSq comparison in renderConnections (skip Math.sqrt for filtering)
//   2: Float32Array for positions (cache locality)
//   3: Spatial hash grid for connections (O(n²) → ~O(n))
//   4: OffscreenCanvas in Web Worker (render off main thread)
//   5: Object pooling + Path2D batching
//
// Architecture refactor (do alongside levels 3-5):
//   Decompose this 504-line service into focused units. ParticleEngine
//   remains the public facade (black box consumed from outside). Internals
//   become separate injectable services — candidates:
//     - ParticleFactory: creation, pooling, recycling of dots/labels
//     - SpatialIndex: grid/hash for neighbor queries (connections)
//     - CanvasRenderer: ctx operations, DPR scaling, bitmap cache
//     - AnimationScheduler: RAF via animationFrames(), visibility control
//     - ObserverManager: Resize/Intersection/Mutation as Observable factories
//   Wire via an Angular module or component-level providers array.
//   Each service is independently testable; engine composes them.
//
// Also pending:
//   - Observable factories for browser observers (co-located teardown)
//   - animationFrames() replacing manual RAF loop
//   - Document or fix one-shot InputSignal reads (DI-003)
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Dot animation ───────────────────────────────────────────────────────────
const DOT_MAX_SPEED = 0.4;
const DOT_MIN_RADIUS = 1;
const DOT_RADIUS_RANGE = 2;

// ─── Label animation ─────────────────────────────────────────────────────────
const LABEL_MAX_SPEED = 0.25;
const LABEL_OFFSCREEN_BUFFER_X = 100;
const LABEL_OFFSCREEN_BUFFER_Y = 30;
const LABEL_REENTRY_OFFSET_X = 50;
const LABEL_REENTRY_OFFSET_Y = 20;

// ─── Connections ─────────────────────────────────────────────────────────────
const CONNECTION_MAX_OPACITY = 0.15;
const CONNECTION_LINE_WIDTH = 0.5;

// ─── Text bitmap ─────────────────────────────────────────────────────────────
const LABEL_FONT = '11px system-ui, sans-serif';
const LABEL_BITMAP_HEIGHT = 16;
const LABEL_BITMAP_PADDING = 4;

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

interface DotParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface LabelParticle {
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

  // ─── State ────────────────────────────────────────────────────────────────

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private config!: ParticleCanvasConfig;
  private dots: DotParticle[] = [];
  private labels: LabelParticle[] = [];
  private animationId: number | null = null;
  private running = false;
  private reducedMotion = false;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private width = 0;
  private height = 0;
  private connectionColorRgb = '139, 92, 246';
  private textColor = 'rgba(100, 116, 139, 0.5)';

  private static readonly FALLBACK_PALETTE = [
    'rgba(139, 92, 246, 0.6)',
    'rgba(99, 102, 241, 0.5)',
    'rgba(168, 85, 247, 0.4)',
    'rgba(255, 255, 255, 0.3)',
  ];

  // ─── Pre-bound RAF callback so we allocate the closure once, not per frame ─
  private readonly tick = this.loop.bind(this);

  // ─── Public API ───────────────────────────────────────────────────────────

  boot(
    labels: InputSignal<string[]>,
    config: InputSignal<Partial<ParticleCanvasConfig>>,
  ): void {
    afterNextRender(() => {
      const canvas = this.elementRef.nativeElement.querySelector('canvas');
      if (!canvas) return;

      this.initCanvas(canvas, {
        ...config(),
        labels: labels(),
      });

      this.intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.start();
          } else {
            this.stop();
          }
        },
        { threshold: 0.1 },
      );
      this.intersectionObserver.observe(canvas);

      this.mutationObserver = new MutationObserver(() => {
        this.refreshColors();
      });
      this.mutationObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    });

    this.destroyRef.onDestroy(() => this.teardown());
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  private initCanvas(
    canvas: HTMLCanvasElement,
    config: Partial<ParticleCanvasConfig> = {},
  ): void {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
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

    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.applyDprScaling();
    this.createParticles();
    this.observeResize();

    if (this.reducedMotion) {
      this.render();
    }
  }

  private start(): void {
    if (this.running || this.reducedMotion) return;
    this.running = true;
    this.loop();
  }

  private stop(): void {
    this.running = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private teardown(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.dots = [];
    this.labels = [];
  }

  private refreshColors(): void {
    if (!this.canvas) return;

    const tokens = this.readCSSTokens();

    if (tokens.palette.length > 0) {
      this.config = { ...this.config, palette: tokens.palette };
      for (const dot of this.dots) {
        dot.color =
          tokens.palette[Math.floor(Math.random() * tokens.palette.length)];
      }
    }

    this.connectionColorRgb = tokens.lineRgb;
    this.textColor = tokens.textColor;

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

  private loop(): void {
    if (!this.running) return;
    this.updatePositions();
    this.render();
    this.animationId = requestAnimationFrame(this.tick);
  }

  private updatePositions(): void {
    const w = this.width;
    const h = this.height;

    for (const dot of this.dots) {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < 0) dot.x = w;
      if (dot.x > w) dot.x = 0;
      if (dot.y < 0) dot.y = h;
      if (dot.y > h) dot.y = 0;
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
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.renderConnections();
    this.renderDots();
    this.renderLabels();
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  private renderConnections(): void {
    const dist = this.config.connectionDistance;
    for (let i = 0; i < this.dots.length; i++) {
      for (let j = i + 1; j < this.dots.length; j++) {
        const dx = this.dots[i].x - this.dots[j].x;
        const dy = this.dots[i].y - this.dots[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < dist) {
          const opacity = (1 - d / dist) * CONNECTION_MAX_OPACITY;
          this.ctx.beginPath();
          this.ctx.moveTo(this.dots[i].x, this.dots[i].y);
          this.ctx.lineTo(this.dots[j].x, this.dots[j].y);
          this.ctx.strokeStyle = `rgba(${this.connectionColorRgb}, ${opacity.toFixed(2)})`;
          this.ctx.lineWidth = CONNECTION_LINE_WIDTH;
          this.ctx.stroke();
        }
      }
    }
  }

  private renderDots(): void {
    for (const dot of this.dots) {
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = dot.color;
      this.ctx.fill();
    }
  }

  private renderLabels(): void {
    for (const label of this.labels) {
      if (label.bitmap) {
        this.ctx.drawImage(
          label.bitmap,
          label.x,
          label.y,
          label.bitmapWidth,
          label.bitmapHeight,
        );
      } else {
        this.ctx.font = LABEL_FONT;
        this.ctx.fillStyle = this.textColor;
        this.ctx.fillText(label.label, label.x, label.y);
      }
    }
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

    this.dots = Array.from({ length: dotCount }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * DOT_MAX_SPEED,
      vy: (Math.random() - 0.5) * DOT_MAX_SPEED,
      radius: Math.random() * DOT_RADIUS_RANGE + DOT_MIN_RADIUS,
      color:
        this.config.palette[
          Math.floor(Math.random() * this.config.palette.length)
        ],
    }));

    const configLabels = this.config.labels;
    if (configLabels.length === 0) return;

    this.labels = Array.from({ length: labelCount }, (_, i) => {
      const text = configLabels[i % configLabels.length];
      const bitmapInfo = this.createLabelBitmap(text);

      return {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
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

  private applyDprScaling(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private observeResize(): void {
    let prevW = this.canvas.getBoundingClientRect().width;
    let prevH = this.canvas.getBoundingClientRect().height;

    this.resizeObserver = new ResizeObserver(() => {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width === prevW && rect.height === prevH) return;

      const oldW = prevW;
      const oldH = prevH;
      prevW = rect.width;
      prevH = rect.height;

      this.applyDprScaling();
      this.rescalePositions(oldW, oldH, rect.width, rect.height);

      if (!this.running) {
        this.render();
      }
    });
    this.resizeObserver.observe(this.canvas);
  }

  private rescalePositions(
    oldW: number,
    oldH: number,
    newW: number,
    newH: number,
  ): void {
    const sx = newW / oldW;
    const sy = newH / oldH;

    for (const dot of this.dots) {
      dot.x *= sx;
      dot.y *= sy;
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

    return { palette, lineRgb, textColor };
  }
}
