import { Component, inject } from "@angular/core";
import { ProfileStore } from "../../stores/profile.store";
import { HeroSection } from "../../sections/hero/hero.section";
import { AboutSection } from "../../sections/about/about.section";
import { ExperienceSection } from "../../sections/experience/experience.section";
import { ProjectsSection } from "../../sections/projects/projects.section";
import { ContactSection } from "../../sections/contact/contact.section";

@Component({
  selector: "app-portfolio",
  standalone: true,
  imports: [
    HeroSection,
    AboutSection,
    ExperienceSection,
    ProjectsSection,
    ContactSection,
  ],
  templateUrl: "./portfolio.page.html",
})
export class PortfolioPage {
  protected readonly store = inject(ProfileStore);
}
