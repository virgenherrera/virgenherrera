import { Component, input } from "@angular/core";
import { ScrollRevealDirective } from "@virgenherrera/ui";
import type { LinkData } from "../../types/profile.types";

@Component({
  selector: "app-projects",
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: "./projects.section.html",
})
export class ProjectsSection {
  readonly links = input.required<LinkData[]>();
}
