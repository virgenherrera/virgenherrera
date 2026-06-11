import { Injectable } from "@angular/core";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import type { jsPDF } from "jspdf";
import type {
  EducationData,
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
  education: EducationData[];
  skills: SkillCategoryData[];
  languages: LanguageData[];
}

interface PdfRenderContext {
  doc: jsPDF;
  y: number;
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
  async download(data: ResumeData): Promise<void> {
    const { jsPDF } = await import("jspdf");
    let ctx: PdfRenderContext = {
      doc: new jsPDF({ unit: "mm", format: "a4" }),
      y: MARGIN,
    };

    ctx = this.renderHeader(ctx, data);
    ctx = this.renderSection(ctx, "Professional Summary", (c) =>
      this.renderBody(c, data.summary),
    );
    ctx = this.renderSection(ctx, "Work Experience", (c) =>
      this.renderExperience(c, data.experience),
    );
    ctx = this.renderSection(ctx, "Education", (c) =>
      this.renderEducation(c, data.education),
    );
    ctx = this.renderSection(ctx, "Skills", (c) =>
      this.renderSkills(c, data.skills),
    );
    ctx = this.renderSection(ctx, "Languages", (c) =>
      this.renderLanguages(c, data.languages),
    );

    ctx.doc.save("hugo-virgen-herrera-resume.pdf");
  }

  private renderHeader(
    ctx: PdfRenderContext,
    data: ResumeData,
  ): PdfRenderContext {
    const center = PAGE_WIDTH / 2;

    ctx.doc.setFontSize(FONT_SIZES.name);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.text(data.name, center, ctx.y, { align: "center" });
    ctx = { ...ctx, y: ctx.y + 8 };

    ctx.doc.setFontSize(FONT_SIZES.body);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setTextColor(100);
    ctx.doc.text(data.headline, center, ctx.y, { align: "center" });
    ctx = { ...ctx, y: ctx.y + LINE_HEIGHT + 2 };

    ctx.doc.setFontSize(FONT_SIZES.small);
    ctx = this.renderHeaderContacts(ctx, data, center);

    ctx.doc.setTextColor(0);
    ctx = { ...ctx, y: ctx.y + 2 };
    ctx.doc.setDrawColor(200);
    ctx.doc.line(MARGIN, ctx.y, PAGE_WIDTH - MARGIN, ctx.y);
    ctx = { ...ctx, y: ctx.y + SECTION_GAP };

    return ctx;
  }

  private renderHeaderContacts(
    ctx: PdfRenderContext,
    data: ResumeData,
    center: number,
  ): PdfRenderContext {
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
    const fullWidth = ctx.doc.getTextWidth(fullText);
    let x = center - fullWidth / 2;

    items.forEach((item, idx) => {
      const textWidth = ctx.doc.getTextWidth(item.text);

      if (item.url) {
        ctx.doc.setTextColor(0, 0, 180);
        ctx.doc.textWithLink(item.text, x, ctx.y, { url: item.url });
      } else {
        ctx.doc.setTextColor(100);
        ctx.doc.text(item.text, x, ctx.y);
      }

      x += textWidth;

      if (idx < items.length - 1) {
        ctx.doc.setTextColor(100);
        ctx.doc.text(separator, x, ctx.y);
        x += ctx.doc.getTextWidth(separator);
      }
    });

    ctx.doc.setTextColor(100);

    return { ...ctx, y: ctx.y + LINE_HEIGHT };
  }

  private renderSection(
    ctx: PdfRenderContext,
    title: string,
    content: (ctx: PdfRenderContext) => PdfRenderContext,
  ): PdfRenderContext {
    ctx = this.checkPageBreak(ctx, 20);

    ctx.doc.setFontSize(FONT_SIZES.sectionTitle);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setTextColor(0);
    ctx.doc.text(title.toUpperCase(), MARGIN, ctx.y);
    ctx = { ...ctx, y: ctx.y + 2 };
    ctx.doc.setDrawColor(220);
    ctx.doc.line(MARGIN, ctx.y, PAGE_WIDTH - MARGIN, ctx.y);
    ctx = { ...ctx, y: ctx.y + LINE_HEIGHT };

    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(FONT_SIZES.body);
    ctx = content(ctx);
    ctx = { ...ctx, y: ctx.y + SECTION_GAP };

    return ctx;
  }

  private renderExperience(
    ctx: PdfRenderContext,
    experiences: ExperienceData[],
  ): PdfRenderContext {
    for (const exp of experiences) {
      ctx = this.checkPageBreak(ctx, 25);

      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.setFontSize(FONT_SIZES.body);
      ctx.doc.text(exp.role, MARGIN, ctx.y);

      const dateRange = `${this.fmtDate(exp.startDate)} — ${this.fmtDate(exp.endDate)}`;
      ctx.doc.setFont("helvetica", "normal");
      ctx.doc.setTextColor(100);
      const dateWidth = ctx.doc.getTextWidth(dateRange);
      ctx.doc.text(dateRange, PAGE_WIDTH - MARGIN - dateWidth, ctx.y);
      ctx = { ...ctx, y: ctx.y + LINE_HEIGHT };

      ctx.doc.setFontSize(FONT_SIZES.small);
      ctx.doc.text(exp.company, MARGIN, ctx.y);
      ctx = { ...ctx, y: ctx.y + LINE_HEIGHT };

      ctx.doc.setTextColor(60);
      for (const item of exp.description) {
        if (item.startsWith("*")) {
          const bulletIndent = 4;
          ctx.doc.text("•", MARGIN + 1, ctx.y);
          ctx = this.textJustified(
            ctx,
            item.slice(1).trim(),
            MARGIN + bulletIndent,
            CONTENT_WIDTH - bulletIndent,
          );
        } else {
          ctx = this.textJustified(ctx, item, MARGIN, CONTENT_WIDTH);
        }
      }

      if (exp.technologies.length > 0) {
        ctx = { ...ctx, y: ctx.y + 2 };
        ctx.doc.setTextColor(120);
        ctx.doc.setFontSize(FONT_SIZES.small);
        const techLines = ctx.doc.splitTextToSize(
          exp.technologies.join(" · "),
          CONTENT_WIDTH,
        ) as string[];
        ctx.doc.text(techLines, MARGIN, ctx.y);
        ctx = { ...ctx, y: ctx.y + techLines.length * (LINE_HEIGHT - 1) };
      }

      ctx.doc.setTextColor(0);
      ctx = { ...ctx, y: ctx.y + 4 };
    }

    return ctx;
  }

  private renderEducation(
    ctx: PdfRenderContext,
    education: EducationData[],
  ): PdfRenderContext {
    for (const edu of education) {
      ctx = this.checkPageBreak(ctx, 15);

      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.setFontSize(FONT_SIZES.body);
      ctx.doc.text(edu.degreeTranslation, MARGIN, ctx.y);

      ctx.doc.setFont("helvetica", "normal");
      ctx.doc.setTextColor(100);
      const dateRange = `${this.fmtDate(edu.startDate)} – ${this.fmtDate(edu.graduationDate)}`;
      const yearWidth = ctx.doc.getTextWidth(dateRange);
      ctx.doc.text(dateRange, PAGE_WIDTH - MARGIN - yearWidth, ctx.y);
      ctx = { ...ctx, y: ctx.y + LINE_HEIGHT };

      ctx.doc.setFontSize(FONT_SIZES.small);
      ctx.doc.text(`${edu.institution} — ${edu.location}`, MARGIN, ctx.y);
      ctx = { ...ctx, y: ctx.y + LINE_HEIGHT };

      if (edu.honors) {
        ctx.doc.setTextColor(60);
        ctx.doc.text(edu.honors, MARGIN, ctx.y);
        ctx = { ...ctx, y: ctx.y + LINE_HEIGHT };
      }

      ctx.doc.setTextColor(0);
      ctx = { ...ctx, y: ctx.y + 2 };
    }

    return ctx;
  }

  private renderSkills(
    ctx: PdfRenderContext,
    skills: SkillCategoryData[],
  ): PdfRenderContext {
    for (const category of skills) {
      ctx = this.checkPageBreak(ctx, 10);
      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.text(`${category.category}: `, MARGIN, ctx.y);
      const labelWidth = ctx.doc.getTextWidth(`${category.category}: `);
      ctx.doc.setFont("helvetica", "normal");
      ctx.doc.setTextColor(80);
      const skillLines = ctx.doc.splitTextToSize(
        category.skills.join(", "),
        CONTENT_WIDTH - labelWidth,
      ) as string[];
      ctx.doc.text(skillLines, MARGIN + labelWidth, ctx.y);
      ctx = { ...ctx, y: ctx.y + Math.max(skillLines.length, 1) * LINE_HEIGHT };
      ctx.doc.setTextColor(0);
    }

    return ctx;
  }

  private renderLanguages(
    ctx: PdfRenderContext,
    languages: LanguageData[],
  ): PdfRenderContext {
    const text = languages
      .map((l) => `${l.language} — ${l.proficiency}`)
      .join("    ");
    ctx.doc.text(text, MARGIN, ctx.y);

    return { ...ctx, y: ctx.y + LINE_HEIGHT };
  }

  private renderBody(ctx: PdfRenderContext, text: string): PdfRenderContext {
    ctx.doc.setTextColor(60);
    ctx = this.textJustified(ctx, text, MARGIN, CONTENT_WIDTH);
    ctx.doc.setTextColor(0);

    return ctx;
  }

  private textJustified(
    ctx: PdfRenderContext,
    text: string,
    x: number,
    width: number,
  ): PdfRenderContext {
    const lines = ctx.doc.splitTextToSize(text, width) as string[];

    for (const [idx, line] of lines.entries()) {
      ctx = this.checkPageBreak(ctx, LINE_HEIGHT);
      const isLast = idx === lines.length - 1;
      const words = line.split(/\s+/).filter(Boolean);

      if (isLast || words.length <= 1) {
        ctx.doc.text(line, x, ctx.y);
      } else {
        const wordsWidth = words.reduce(
          (sum, w) => sum + ctx.doc.getTextWidth(w),
          0,
        );
        const gap = (width - wordsWidth) / (words.length - 1);
        let cx = x;

        words.forEach((word) => {
          ctx.doc.text(word, cx, ctx.y);
          cx += ctx.doc.getTextWidth(word) + gap;
        });
      }

      ctx = { ...ctx, y: ctx.y + LINE_HEIGHT - 1 };
    }

    return ctx;
  }

  private fmtDate(value: string | undefined): string {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) {
      return value ?? "Present";
    }

    return format(parse(value, "yyyy-MM", new Date()), "MMM yyyy");
  }

  private checkPageBreak(
    ctx: PdfRenderContext,
    needed: number,
  ): PdfRenderContext {
    if (ctx.y + needed > 280) {
      ctx.doc.addPage();

      return { ...ctx, y: MARGIN };
    }

    return ctx;
  }
}
