import { Component, input } from "@angular/core";

@Component({
  selector: "app-hero",
  standalone: true,
  templateUrl: "./hero.section.html",
})
export class HeroSection {
  readonly name = input.required<string>();
  readonly headline = input.required<string>();
  readonly location = input.required<string>();
}
