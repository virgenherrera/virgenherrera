import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  type OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { ProfileStore } from "../../stores/profile.store";

interface DotParticle {
  kind: "dot";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface TextParticle {
  kind: "text";
  x: number;
  y: number;
  vx: number;
  vy: number;
  bitmap: HTMLCanvasElement;
  width: number;
  height: number;
}

type Particle = DotParticle | TextParticle;

const PARTICLE_COLORS = [
  "rgba(139, 92, 246, 0.6)",
  "rgba(99, 102, 241, 0.5)",
  "rgba(168, 85, 247, 0.4)",
  "rgba(255, 255, 255, 0.3)",
  "rgba(139, 92, 246, 0.3)",
];

const CONNECTION_DISTANCE = 120;
const MOBILE_BREAKPOINT = 768;
const DESKTOP_DOT_COUNT = 60;
const MOBILE_DOT_COUNT = 30;
const DESKTOP_TEXT_COUNT = 18;
const MOBILE_TEXT_COUNT = 10;
const TEXT_FONT = "11px system-ui, sans-serif";
const TEXT_COLOR = "rgba(139, 92, 246, 0.35)";

@Component({
  selector: "app-interactive-hero",
  standalone: true,
  templateUrl: "./interactive-hero.section.html",
  styles: `
    :host {
      display: block;
    }

    .hero-subtitle {
      animation: hero-fade-in 1s ease-out 0.3s both;
    }

    @keyframes hero-fade-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .scroll-indicator {
      animation: hero-fade-in 1s ease-out 1s both;
    }

    .typewriter-cursor {
      animation: blink 1s step-end infinite;
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
  `,
})
export class InteractiveHeroSection implements OnDestroy {
  protected readonly store = inject(ProfileStore);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvasRef =
    viewChild<ElementRef<HTMLCanvasElement>>("particleCanvas");

  private animationFrameId: number | null = null;
  private particles: Particle[] = [];
  private textBitmapCache = new Map<string, HTMLCanvasElement>();
  private ctx: CanvasRenderingContext2D | null = null;
  private prefersReducedMotion = false;
  private resizeHandler: (() => void) | null = null;
  private scrollHandler: (() => void) | null = null;
  private typewriterTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly hasScrolled = signal(false);
  protected readonly displayedText = signal("");

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      this.prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      this.setupScrollListener();
      this.startTypewriter();

      if (this.prefersReducedMotion) return;

      this.initCanvas();
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (isPlatformBrowser(this.platformId)) {
      if (this.resizeHandler) {
        window.removeEventListener("resize", this.resizeHandler);
      }
      if (this.scrollHandler) {
        window.removeEventListener("scroll", this.scrollHandler);
      }
    }
    if (this.typewriterTimer !== null) {
      clearTimeout(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    this.textBitmapCache.clear();
  }

  protected onMouseMove(): void {
    // Reserved for future eye-tracking iteration
  }

  protected scrollToPortfolio(): void {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  }

  private startTypewriter(): void {
    const skills = this.getTechLabels();
    let skillIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    const TYPE_SPEED = 80;
    const DELETE_SPEED = 40;
    const PAUSE_AFTER_TYPE = 2000;
    const PAUSE_AFTER_DELETE = 400;

    const tick = (): void => {
      const current = skills[skillIdx % skills.length]!;

      if (!isDeleting) {
        charIdx++;
        this.displayedText.set(current.slice(0, charIdx));

        if (charIdx === current.length) {
          isDeleting = true;
          this.typewriterTimer = setTimeout(tick, PAUSE_AFTER_TYPE);

          return;
        }
        this.typewriterTimer = setTimeout(tick, TYPE_SPEED);
      } else {
        charIdx--;
        this.displayedText.set(current.slice(0, charIdx));

        if (charIdx === 0) {
          isDeleting = false;
          skillIdx++;
          this.typewriterTimer = setTimeout(tick, PAUSE_AFTER_DELETE);

          return;
        }
        this.typewriterTimer = setTimeout(tick, DELETE_SPEED);
      }
    };

    this.typewriterTimer = setTimeout(tick, 1000);
  }

  private setupScrollListener(): void {
    this.scrollHandler = (): void => {
      this.hasScrolled.set(window.scrollY > 50);
    };
    window.addEventListener("scroll", this.scrollHandler, { passive: true });
  }

  private getTechLabels(): string[] {
    const skills = this.store.skills();
    const labels: string[] = [];
    for (const group of skills) {
      for (const skill of group.skills) {
        labels.push(skill);
      }
    }

    return labels;
  }

  private getTextBitmap(label: string): HTMLCanvasElement {
    const cached = this.textBitmapCache.get(label);
    if (cached) return cached;

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    offCtx.font = TEXT_FONT;
    const metrics = offCtx.measureText(label);
    const w = Math.ceil(metrics.width) + 4;
    const h = 16;

    offscreen.width = w * dpr;
    offscreen.height = h * dpr;
    offCtx.scale(dpr, dpr);
    offCtx.font = TEXT_FONT;
    offCtx.fillStyle = TEXT_COLOR;
    offCtx.textBaseline = "middle";
    offCtx.fillText(label, 2, h / 2);

    this.textBitmapCache.set(label, offscreen);

    return offscreen;
  }

  private initCanvas(): void {
    const canvasEl = this.canvasRef()?.nativeElement;
    if (!canvasEl) return;

    this.ctx = canvasEl.getContext("2d");
    if (!this.ctx) return;

    this.resizeCanvas(canvasEl);
    this.createParticles(canvasEl);
    this.animate(canvasEl);

    this.resizeHandler = (): void => {
      this.resizeCanvas(canvasEl);
      this.particles = [];
      this.createParticles(canvasEl);
    };
    window.addEventListener("resize", this.resizeHandler);
  }

  private resizeCanvas(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    this.ctx?.scale(dpr, dpr);
  }

  private createParticles(canvas: HTMLCanvasElement): void {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const dotCount = isMobile ? MOBILE_DOT_COUNT : DESKTOP_DOT_COUNT;
    const textCount = isMobile ? MOBILE_TEXT_COUNT : DESKTOP_TEXT_COUNT;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    // Dot particles
    for (let i = 0; i < dotCount; i++) {
      this.particles.push({
        kind: "dot",
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        color:
          PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]!,
      });
    }

    // Text particles — pick random tech labels
    const labels = this.getTechLabels();
    for (let i = 0; i < textCount; i++) {
      const label = labels[i % labels.length]!;
      const bitmap = this.getTextBitmap(label);
      const dpr = window.devicePixelRatio || 1;
      this.particles.push({
        kind: "text",
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        bitmap,
        width: bitmap.width / dpr,
        height: bitmap.height / dpr,
      });
    }
  }

  private animate(canvas: HTMLCanvasElement): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      if (p.kind === "dot") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else {
        ctx.drawImage(p.bitmap, p.x, p.y, p.width, p.height);
      }
    }

    // Draw connections (only between dot particles for performance)
    ctx.lineWidth = 0.5;
    const dots = this.particles.filter(
      (p): p is DotParticle => p.kind === "dot",
    );
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i]!;
        const b = dots[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DISTANCE) {
          const opacity = 1 - dist / CONNECTION_DISTANCE;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${(opacity * 0.15).toFixed(2)})`;
          ctx.stroke();
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate(canvas));
  }
}
