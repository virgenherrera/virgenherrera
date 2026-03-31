import { Component, input } from "@angular/core";
import type { LinkData } from "../../types/profile.types";

@Component({
  selector: "app-projects",
  standalone: true,
  templateUrl: "./projects.section.html",
})
export class ProjectsSection {
  readonly links = input.required<LinkData[]>();
}
