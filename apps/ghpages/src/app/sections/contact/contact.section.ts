import { Component, input } from "@angular/core";
import { PdfButtonComponent } from "../../components/pdf-button/pdf-button.component";
import type { LinkData } from "../../types/profile.types";

@Component({
  selector: "app-contact",
  standalone: true,
  imports: [PdfButtonComponent],
  templateUrl: "./contact.section.html",
})
export class ContactSection {
  readonly links = input.required<LinkData[]>();
  readonly email = input.required<string | null>();
  readonly phone = input.required<string | null>();
  readonly showPdfButton = input.required<boolean>();
}
