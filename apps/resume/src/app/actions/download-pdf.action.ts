import { Injectable, Signal, computed, inject } from '@angular/core';
import { HubAction, HubContext } from '@vh/design-system';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { ProfileStore } from '../stores/profile.store';

const LINKEDIN_URL = 'https://www.linkedin.com/in/virgenherrera';

@Injectable()
export class DownloadPdfAction implements HubAction {
  private readonly pdfService = inject(PdfGeneratorService);
  private readonly profileStore = inject(ProfileStore);

  readonly id = 'download-pdf';
  readonly zone = 'contextual' as const;
  readonly order = 10;

  readonly label: Signal<string> = computed(() =>
    this.profileStore.isPrivateView()
      ? 'Download resume'
      : 'Request full access',
  );

  readonly icon: Signal<string> = computed(() =>
    this.profileStore.isPrivateView() ? 'download' : 'linkedIn',
  );

  readonly highlight: Signal<boolean> = computed(
    () => !this.profileStore.isPrivateView(),
  );

  isAvailable(_ctx: HubContext): boolean {
    return true;
  }

  async execute(): Promise<void> {
    if (this.profileStore.isPrivateView()) {
      await this.pdfService.generate({
        ...this.profileStore.profile,
        email: this.profileStore.email(),
        phone: this.profileStore.phone(),
      });
    } else {
      window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer');
    }
  }
}
