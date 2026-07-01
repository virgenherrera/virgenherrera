import { Injectable, Signal, inject, signal } from '@angular/core';
import { HubAction, HubContext } from '@vh/design-system';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { ProfileStore } from '../stores/profile.store';

@Injectable()
export class DownloadPdfAction implements HubAction {
  private readonly pdfService = inject(PdfGeneratorService);
  private readonly profileStore = inject(ProfileStore);

  readonly id = 'download-pdf';
  readonly label: Signal<string> = signal('Download resume');
  readonly icon: Signal<string> = signal('download');
  readonly zone = 'contextual' as const;
  readonly order = 10;

  isAvailable(ctx: HubContext): boolean {
    return ctx.isPrivateView;
  }

  async execute(): Promise<void> {
    await this.pdfService.generate({
      ...this.profileStore.profile,
      email: this.profileStore.email(),
      phone: this.profileStore.phone(),
    });
  }
}
