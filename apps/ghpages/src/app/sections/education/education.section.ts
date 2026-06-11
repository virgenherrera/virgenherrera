import { Component, input } from "@angular/core";
import type { EducationData } from "../../types/profile.types";
import { FormatDatePipe } from "@virgenherrera/ui";

@Component({
  selector: "app-education",
  standalone: true,
  imports: [FormatDatePipe],
  templateUrl: "./education.section.html",
})
export class EducationSection {
  readonly education = input.required<EducationData[]>();
}
