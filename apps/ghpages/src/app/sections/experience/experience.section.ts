import { Component, input } from "@angular/core";
import type { ExperienceData } from "../../types/profile.types";

@Component({
  selector: "app-experience",
  standalone: true,
  templateUrl: "./experience.section.html",
})
export class ExperienceSection {
  readonly experiences = input.required<ExperienceData[]>();
}
