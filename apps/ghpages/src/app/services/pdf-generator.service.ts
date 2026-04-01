import { Injectable } from "@angular/core";
import { jsPDF } from "jspdf";
import type {
  ExperienceData,
  LanguageData,
  LinkData,
  SkillCategoryData,
} from "../types/profile.types";

interface ResumeData {
  name: string;
  headline: string;
  location: string;
  summary: string;
  email: string | null;
  phone: string | null;
  links: LinkData[];
  experience: ExperienceData[];
  skills: SkillCategoryData[];
  languages: LanguageData[];
}

const PAGE_WIDTH = 210;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 5;
const SECTION_GAP = 8;
const FONT_SIZES = {
  name: 20,
  sectionTitle: 11,
  body: 9,
  small: 8,
} as const;

@Injectable({ providedIn: "root" })
export class PdfGeneratorService {
  private doc!: jsPDF;
  private y = 0;

  download(data: ResumeData): void {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.y = MARGIN;

    this.renderHeader(data);
    this.renderSection("Professional Summary", () => {
      this.renderBody(data.summary);
    });
    this.renderSection("Work Experience", () => {
      this.renderExperience(data.experience);
    });
    this.renderSection("Skills", () => {
      this.renderSkills(data.skills);
    });
    this.renderSection("Languages", () => {
      this.renderLanguages(data.languages);
    });

    this.doc.save("hugo-virgen-herrera-resume.pdf");
  }

  private renderHeader(data: ResumeData): void {
    const center = PAGE_WIDTH / 2;

    this.doc.setFontSize(FONT_SIZES.name);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(data.name, center, this.y, { align: "center" });
    this.y += 8;

    this.doc.setFontSize(FONT_SIZES.body);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100);
    this.doc.text(data.headline, center, this.y, { align: "center" });
    this.y += LINE_HEIGHT + 2;

    this.doc.setFontSize(FONT_SIZES.small);
    this.renderHeaderContacts(data, center);

    this.doc.setTextColor(0);
    this.y += 2;
    this.doc.setDrawColor(200);
    this.doc.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    this.y += SECTION_GAP;
  }

  private renderHeaderContacts(data: ResumeData, center: number): void {
    const items: { text: string; url?: string }[] = [{ text: data.location }];

    if (data.email) {
      items.push({ text: data.email, url: `mailto:${data.email}` });
    }
    if (data.phone) {
      items.push({ text: data.phone, url: `tel:${data.phone}` });
    }
    data.links.forEach((link) => {
      items.push({ text: link.label, url: link.url });
    });

    const separator = "  |  ";
    const fullText = items.map((i) => i.text).join(separator);
    const fullWidth = this.doc.getTextWidth(fullText);
    let x = center - fullWidth / 2;

    items.forEach((item, idx) => {
      const textWidth = this.doc.getTextWidth(item.text);

      if (item.url) {
        this.doc.setTextColor(0, 0, 180);
        this.doc.textWithLink(item.text, x, this.y, { url: item.url });
      } else {
        this.doc.setTextColor(100);
        this.doc.text(item.text, x, this.y);
      }

      x += textWidth;

      if (idx < items.length - 1) {
        this.doc.setTextColor(100);
        this.doc.text(separator, x, this.y);
        x += this.doc.getTextWidth(separator);
      }
    });

    this.doc.setTextColor(100);
    this.y += LINE_HEIGHT;
  }

  private renderSection(title: string, content: () => void): void {
    this.checkPageBreak(20);

    this.doc.setFontSize(FONT_SIZES.sectionTitle);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0);
    this.doc.text(title.toUpperCase(), MARGIN, this.y);
    this.y += 2;
    this.doc.setDrawColor(220);
    this.doc.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    this.y += LINE_HEIGHT;

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(FONT_SIZES.body);
    content();
    this.y += SECTION_GAP;
  }

  private renderExperience(experiences: ExperienceData[]): void {
    experiences.forEach((exp) => {
      this.checkPageBreak(25);

      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(FONT_SIZES.body);
      this.doc.text(exp.role, MARGIN, this.y);

      const dateRange = `${exp.startDate} — ${exp.endDate ?? "Present"}`;
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100);
      const dateWidth = this.doc.getTextWidth(dateRange);
      this.doc.text(dateRange, PAGE_WIDTH - MARGIN - dateWidth, this.y);
      this.y += LINE_HEIGHT;

      this.doc.setFontSize(FONT_SIZES.small);
      this.doc.text(exp.company, MARGIN, this.y);
      this.y += LINE_HEIGHT;

      this.doc.setTextColor(60);
      const descLines = this.doc.splitTextToSize(
        exp.description,
        CONTENT_WIDTH,
      ) as string[];
      this.doc.text(descLines, MARGIN, this.y);
      this.y += descLines.length * (LINE_HEIGHT - 1);

      if (exp.technologies.length > 0) {
        this.y += 2;
        this.doc.setTextColor(120);
        this.doc.setFontSize(FONT_SIZES.small);
        const techLines = this.doc.splitTextToSize(
          exp.technologies.join(" · "),
          CONTENT_WIDTH,
        ) as string[];
        this.doc.text(techLines, MARGIN, this.y);
        this.y += techLines.length * (LINE_HEIGHT - 1);
      }

      this.doc.setTextColor(0);
      this.y += 4;
    });
  }

  private renderSkills(skills: SkillCategoryData[]): void {
    skills.forEach((category) => {
      this.checkPageBreak(10);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(`${category.category}: `, MARGIN, this.y);
      const labelWidth = this.doc.getTextWidth(`${category.category}: `);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(80);
      const skillLines = this.doc.splitTextToSize(
        category.skills.join(", "),
        CONTENT_WIDTH - labelWidth,
      ) as string[];
      this.doc.text(skillLines, MARGIN + labelWidth, this.y);
      this.y += Math.max(skillLines.length, 1) * LINE_HEIGHT;
      this.doc.setTextColor(0);
    });
  }

  private renderLanguages(languages: LanguageData[]): void {
    const text = languages
      .map((l) => `${l.language} — ${l.proficiency}`)
      .join("    ");
    this.doc.text(text, MARGIN, this.y);
    this.y += LINE_HEIGHT;
  }

  private renderBody(text: string): void {
    this.doc.setTextColor(60);
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    this.doc.text(lines, MARGIN, this.y);
    this.y += lines.length * LINE_HEIGHT;
    this.doc.setTextColor(0);
  }

  private checkPageBreak(needed: number): void {
    if (this.y + needed > 280) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }
}
