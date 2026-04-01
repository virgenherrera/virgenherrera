import { Component, input } from "@angular/core";
import { ScrollRevealDirective } from "../../directives/scroll-reveal.directive";
import type { ExperienceData } from "../../types/profile.types";

interface DescriptionBlock {
  type: "paragraph" | "bullets";
  items: string[];
}

function groupDescription(description: string[]): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];

  for (const item of description) {
    if (item.startsWith("*")) {
      const last = blocks[blocks.length - 1];

      if (last?.type === "bullets") {
        last.items.push(item.slice(1));
      } else {
        blocks.push({ type: "bullets", items: [item.slice(1)] });
      }
    } else {
      blocks.push({ type: "paragraph", items: [item] });
    }
  }

  return blocks;
}

@Component({
  selector: "app-experience",
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: "./experience.section.html",
})
export class ExperienceSection {
  readonly experiences = input.required<ExperienceData[]>();
  readonly isPrivate = input(false);

  descriptionBlocks(description: string[]): DescriptionBlock[] {
    return groupDescription(description);
  }
}
