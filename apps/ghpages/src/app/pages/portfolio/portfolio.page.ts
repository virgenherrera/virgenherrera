import {
  afterNextRender,
  Component,
  ElementRef,
  HostListener,
  inject,
  type OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { ProfileStore } from "../../stores/profile.store";
import { HeroSection } from "../../sections/hero/hero.section";
import { AboutSection } from "../../sections/about/about.section";
import { ExperienceSection } from "../../sections/experience/experience.section";
import { ProjectsSection } from "../../sections/projects/projects.section";
import { ContactSection } from "../../sections/contact/contact.section";
import { InteractiveHeroSection } from "../../sections/interactive-hero/interactive-hero.section";

const SCROLL_THRESHOLD = 300;

@Component({
  selector: "app-portfolio",
  standalone: true,
  imports: [
    HeroSection,
    AboutSection,
    ExperienceSection,
    ProjectsSection,
    ContactSection,
    InteractiveHeroSection,
  ],
  templateUrl: "./portfolio.page.html",
})
export class PortfolioPage implements OnDestroy {
  protected readonly store = inject(ProfileStore);
  protected readonly showFab = signal(false);
  protected readonly heroMounted = signal(false);
  protected readonly heroOpacity = signal(1);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly heroSentinel =
    viewChild<ElementRef<HTMLDivElement>>("heroSentinel");
  private observer: IntersectionObserver | null = null;
  private scrollHandler: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      this.heroMounted.set(true);

      const sentinel = this.heroSentinel()?.nativeElement;
      if (!sentinel) return;

      // Scroll-based opacity fade: hero fades out as user scrolls through sentinel
      this.scrollHandler = () => {
        const rect = sentinel.getBoundingClientRect();
        const sentinelH = sentinel.offsetHeight;
        // ratio: 1 = fully visible, 0 = fully scrolled past
        const ratio = Math.max(0, Math.min(1, rect.bottom / sentinelH));
        this.heroOpacity.set(ratio);
      };
      window.addEventListener("scroll", this.scrollHandler, { passive: true });

      // Only unmount when sentinel is FULLY off-screen (threshold: 0.01)
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry) {
            this.heroMounted.set(entry.isIntersecting);
          }
        },
        { threshold: 0.01 },
      );
      this.observer.observe(sentinel);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
      this.scrollHandler = null;
    }
  }

  @HostListener("window:scroll")
  onScroll(): void {
    this.showFab.set(window.scrollY > SCROLL_THRESHOLD);
  }
}
