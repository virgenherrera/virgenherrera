import { Component, inject } from "@angular/core";
import { ProfileStore } from "../../stores/profile.store";
import { PdfGeneratorService } from "../../services/pdf-generator.service";

@Component({
  selector: "app-pdf-button",
  standalone: true,
  templateUrl: "./pdf-button.component.html",
})
export class PdfButtonComponent {
  private readonly store = inject(ProfileStore);
  private readonly pdf = inject(PdfGeneratorService);

  download(): void {
    this.pdf.download({
      name: this.store.name(),
      headline: this.store.headline(),
      location: this.store.location(),
      summary: this.store.summary(),
      email: this.store.email(),
      phone: this.store.phone(),
      links: this.store.links(),
      experience: this.store.experience(),
      skills: this.store.skills(),
      languages: this.store.languages(),
    });
  }
}
