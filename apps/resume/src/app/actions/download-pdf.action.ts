import { Injectable, signal } from '@angular/core';
import { HubAction, HubContext } from '@vh/design-system';

const DOWNLOAD_TARGET_SELECTOR = '#vh-download-pdf-target';

@Injectable()
export class DownloadPdfAction implements HubAction {
  readonly id = 'download-pdf';
  readonly zone = 'contextual' as const;
  readonly order = 10;

  readonly label = signal('Download resume');
  readonly icon = signal('download');
  readonly highlight = signal(true);
  readonly highlightIntensity = signal<'aggressive' | 'subtle'>('aggressive');
  readonly badge = signal<string | null>('PDF');
  readonly targetHighlight = signal(false);

  isAvailable(ctx: HubContext): boolean {
    return ctx.isPrivateView;
  }

  execute(): void {
    const target = document.querySelector<HTMLElement>(
      DOWNLOAD_TARGET_SELECTOR,
    );
    if (!target) return;

    this.highlight.set(false);

    const rect = target.getBoundingClientRect();
    const inViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;

    if (inViewport) {
      this.targetHighlight.set(true);
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      addEventListener('scrollend', () => this.targetHighlight.set(true), {
        once: true,
      });
    }
  }
}
