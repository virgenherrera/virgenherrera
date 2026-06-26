import { Component, inject, signal } from '@angular/core';
import {
  ExperienceListComponent,
  FileActionComponent,
  JumbotronComponent,
  ProfileSidebarComponent,
  ProjectListComponent,
  StickyScrollDirective,
} from '@vh/design-system';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { ProfileStore } from '../../stores/profile.store';

@Component({
  selector: 'vh-resume-page',
  imports: [
    JumbotronComponent,
    ProfileSidebarComponent,
    ExperienceListComponent,
    ProjectListComponent,
    StickyScrollDirective,
    FileActionComponent,
  ],
  templateUrl: './resume-page.html',
  styleUrl: './resume-page.css',
})
export class ResumePage {
  protected readonly store = inject(ProfileStore);

  protected readonly subtitleItems = this.store.profile.headline.split(' | ');
  protected readonly particleLabels = this.store.profile.skills.flatMap(
    (category) => category.skills,
  );

  private readonly pdfService = inject(PdfGeneratorService);
  protected readonly pdfLoading = signal(false);

  protected async onDownloadPdf(): Promise<void> {
    if (this.pdfLoading()) return;

    this.pdfLoading.set(true);
    try {
      await this.pdfService.generate({
        ...this.store.profile,
        email: this.store.email(),
        phone: this.store.phone(),
      });
    } finally {
      this.pdfLoading.set(false);
    }
  }

  protected onPdfHover(): void {
    this.pdfService.prefetch();
  }
}
