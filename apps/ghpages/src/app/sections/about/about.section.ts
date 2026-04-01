import { Component, input } from "@angular/core";
import type {
  LanguageData,
  SkillCategoryData,
} from "../../types/profile.types";

@Component({
  selector: "app-about",
  standalone: true,
  templateUrl: "./about.section.html",
})
export class AboutSection {
  readonly summary = input.required<string>();
  readonly skills = input.required<SkillCategoryData[]>();
  readonly languages = input.required<LanguageData[]>();
  readonly isPrivate = input(false);
}
