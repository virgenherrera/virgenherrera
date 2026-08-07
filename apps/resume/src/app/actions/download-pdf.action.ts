import { Injectable, Signal, signal } from '@angular/core';
import { HubAction, HubContext } from '@vh/design-system';

/** Stable target for the sidebar's own Download PDF button (see resume-page.html). */
const DOWNLOAD_TARGET_SELECTOR = '#vh-download-pdf-target';
const HIGHLIGHT_CLASS = 'vh-file-action--target-highlight';
const HIGHLIGHT_DURATION_MS = 1500;

/**
 * The floating hub does NOT generate the PDF itself — the sidebar's
 * `vh-file-action[vhContactAction]` button already owns PDF generation via
 * its own `(action)="onDownloadPdf()"` handler. This action just scrolls
 * the user to that button and briefly highlights it, avoiding a duplicate
 * PDF generation path.
 */
@Injectable()
export class DownloadPdfAction implements HubAction {
  readonly id = 'download-pdf';
  readonly zone = 'contextual' as const;
  readonly order = 10;

  readonly label: Signal<string> = signal('Download resume');
  readonly icon: Signal<string> = signal('download');
  readonly highlight: Signal<boolean> = signal(true);
  readonly highlightIntensity = signal<'aggressive' | 'subtle'>('aggressive');
  readonly badge = signal<string | null>('PDF');

  isAvailable(ctx: HubContext): boolean {
    return ctx.isPrivateView;
  }

  execute(): void {
    const target = document.querySelector<HTMLElement>(
      DOWNLOAD_TARGET_SELECTOR,
    );
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const button =
      target.querySelector<HTMLElement>('.vh-file-action') ?? target;
    button.classList.add(HIGHLIGHT_CLASS);
    setTimeout(
      () => button.classList.remove(HIGHLIGHT_CLASS),
      HIGHLIGHT_DURATION_MS,
    );
  }
}
