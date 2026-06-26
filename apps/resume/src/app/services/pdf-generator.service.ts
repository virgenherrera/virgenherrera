import { Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';
import type {
  CertificationData,
  EducationData,
  ExperienceData,
  LanguageData,
  ProfileData,
  SkillCategoryData,
} from '@vh/profile';
import {
  BULLET_INDENT,
  COLORS,
  CONTENT_WIDTH,
  DATE_FORMATTER,
  EXPERIENCE_GAP,
  FONT_SIZES,
  HEADER_POST_NAME_GAP,
  LINE_HEIGHT,
  MARGIN,
  PAGE_BOTTOM_LIMIT,
  PAGE_WIDTH,
  SECTION_GAP,
  SPACER_SM,
} from './pdf-layout.config';

type ResumeData = Omit<ProfileData, 'email' | 'phone'> & {
  email: string | null;
  phone: string | null;
};

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
  private jsPdfPromise: Promise<typeof import('jspdf')> | null = null;

  async generate(data: ResumeData): Promise<void> {
    let jsPdfModule: typeof import('jspdf');

    try {
      jsPdfModule = await this.loadJsPdf();
    } catch (error) {
      console.error('[PdfGeneratorService] Failed to load jsPDF:', error);

      return;
    }

    const { jsPDF } = jsPdfModule;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let cursorY = MARGIN;

    cursorY = this.renderHeader(doc, cursorY, data);
    cursorY = this.renderSection(doc, cursorY, 'Professional Summary', (y) =>
      this.renderBody(doc, y, data.summary),
    );
    cursorY = this.renderSection(doc, cursorY, 'Work Experience', (y) =>
      this.renderExperience(doc, y, data.experience),
    );
    cursorY = this.renderSection(doc, cursorY, 'Education', (y) =>
      this.renderEducation(doc, y, data.education),
    );

    if (data.certifications.length > 0) {
      cursorY = this.renderSection(doc, cursorY, 'Certifications', (y) =>
        this.renderCertifications(doc, y, data.certifications),
      );
    }

    cursorY = this.renderSection(doc, cursorY, 'Skills', (y) =>
      this.renderSkills(doc, y, data.skills),
    );
    this.renderSection(doc, cursorY, 'Languages', (y) =>
      this.renderLanguages(doc, y, data.languages),
    );

    const filename =
      data.name.toLowerCase().replace(/\s+/g, '-') + '-resume.pdf';
    doc.save(filename);
  }

  prefetch(): void {
    void this.loadJsPdf();
  }

  private loadJsPdf(): Promise<typeof import('jspdf')> {
    if (!this.jsPdfPromise) {
      this.jsPdfPromise = import('jspdf').catch((error: unknown) => {
        this.jsPdfPromise = null;
        throw error;
      });
    }

    return this.jsPdfPromise;
  }

  private renderHeader(doc: jsPDF, cursorY: number, data: ResumeData): number {
    const center = PAGE_WIDTH / 2;

    doc.setFontSize(FONT_SIZES.name);
    doc.setFont('helvetica', 'bold');
    doc.text(data.name, center, cursorY, { align: 'center' });
    cursorY += HEADER_POST_NAME_GAP;

    doc.setFontSize(FONT_SIZES.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textMuted);
    doc.text(data.headline, center, cursorY, { align: 'center' });
    cursorY += LINE_HEIGHT + SPACER_SM;

    doc.setFontSize(FONT_SIZES.small);
    cursorY = this.renderHeaderContacts(doc, cursorY, data, center);

    doc.setTextColor(COLORS.textDefault);
    cursorY += SPACER_SM;
    doc.setDrawColor(COLORS.drawDividerHeader);
    doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
    cursorY += SECTION_GAP;

    return cursorY;
  }

  private renderHeaderContacts(
    doc: jsPDF,
    cursorY: number,
    data: ResumeData,
    center: number,
  ): number {
    const items: { text: string; url?: string }[] = [{ text: data.location }];

    if (data.email) {
      items.push({ text: data.email, url: `mailto:${data.email}` });
    }
    if (data.phone) {
      items.push({ text: data.phone, url: `tel:${data.phone}` });
    }
    for (const link of data.links) {
      items.push({ text: link.label, url: link.url });
    }

    const separator = '  |  ';
    const fullText = items.map((item) => item.text).join(separator);
    const fullWidth = doc.getTextWidth(fullText);
    let x = center - fullWidth / 2;

    for (const [idx, item] of items.entries()) {
      const textWidth = doc.getTextWidth(item.text);

      if (item.url) {
        doc.setTextColor(...COLORS.linkRgb);
        doc.textWithLink(item.text, x, cursorY, { url: item.url });
      } else {
        doc.setTextColor(COLORS.textMuted);
        doc.text(item.text, x, cursorY);
      }

      x += textWidth;

      if (idx < items.length - 1) {
        doc.setTextColor(COLORS.textMuted);
        doc.text(separator, x, cursorY);
        x += doc.getTextWidth(separator);
      }
    }

    doc.setTextColor(COLORS.textMuted);

    return cursorY + LINE_HEIGHT;
  }

  private renderSection(
    doc: jsPDF,
    cursorY: number,
    title: string,
    content: (y: number) => number,
  ): number {
    cursorY = this.checkPageBreak(doc, cursorY, 20);

    doc.setFontSize(FONT_SIZES.sectionTitle);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDefault);
    doc.text(title.toUpperCase(), MARGIN, cursorY);
    cursorY += SPACER_SM;
    doc.setDrawColor(COLORS.drawDivider);
    doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
    cursorY += LINE_HEIGHT;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZES.body);
    cursorY = content(cursorY);
    cursorY += SECTION_GAP;

    return cursorY;
  }

  private renderExperience(
    doc: jsPDF,
    cursorY: number,
    experiences: readonly ExperienceData[],
  ): number {
    for (const exp of experiences) {
      cursorY = this.checkPageBreak(doc, cursorY, 25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZES.body);
      doc.text(exp.role, MARGIN, cursorY);

      const dateRange = `${this.fmtDate(exp.startDate)} — ${this.fmtDate(exp.endDate)}`;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textMuted);
      const dateWidth = doc.getTextWidth(dateRange);
      doc.text(dateRange, PAGE_WIDTH - MARGIN - dateWidth, cursorY);
      cursorY += LINE_HEIGHT;

      doc.setFontSize(FONT_SIZES.small);
      doc.text(exp.company, MARGIN, cursorY);
      cursorY += LINE_HEIGHT;

      doc.setTextColor(COLORS.textBody);
      for (const block of exp.description) {
        if (block.type === 'paragraph') {
          for (const line of block.lines) {
            cursorY = this.textJustified(
              doc,
              cursorY,
              line,
              MARGIN,
              CONTENT_WIDTH,
            );
          }
        } else {
          for (const line of block.lines) {
            cursorY = this.checkPageBreak(doc, cursorY, LINE_HEIGHT);
            doc.text('•', MARGIN + 1, cursorY);
            cursorY = this.textJustified(
              doc,
              cursorY,
              line,
              MARGIN + BULLET_INDENT,
              CONTENT_WIDTH - BULLET_INDENT,
            );
          }
        }
      }

      if (exp.technologies.length > 0) {
        cursorY += SPACER_SM;
        doc.setTextColor(COLORS.textTech);
        doc.setFontSize(FONT_SIZES.small);
        const techLines = doc.splitTextToSize(
          exp.technologies.join(' · '),
          CONTENT_WIDTH,
        ) as string[];
        doc.text(techLines, MARGIN, cursorY);
        cursorY += techLines.length * (LINE_HEIGHT - 1);
      }

      doc.setTextColor(COLORS.textDefault);
      cursorY += EXPERIENCE_GAP;
    }

    return cursorY;
  }

  private renderEducation(
    doc: jsPDF,
    cursorY: number,
    education: readonly EducationData[],
  ): number {
    for (const edu of education) {
      cursorY = this.checkPageBreak(doc, cursorY, 15);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZES.body);
      const degreeDisplay = `${edu.degree} (${edu.degreeTranslation})`;
      doc.text(degreeDisplay, MARGIN, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textMuted);
      const dateRange = `${this.fmtDate(edu.startDate)} – ${this.fmtDate(edu.graduationDate)}`;
      const yearWidth = doc.getTextWidth(dateRange);
      doc.text(dateRange, PAGE_WIDTH - MARGIN - yearWidth, cursorY);
      cursorY += LINE_HEIGHT;

      doc.setFontSize(FONT_SIZES.small);
      doc.text(`${edu.institution} — ${edu.location}`, MARGIN, cursorY);
      cursorY += LINE_HEIGHT;

      if (edu.honors) {
        doc.setTextColor(COLORS.textBody);
        doc.text(edu.honors, MARGIN, cursorY);
        cursorY += LINE_HEIGHT;
      }

      doc.setTextColor(COLORS.textDefault);
      cursorY += SPACER_SM;
    }

    return cursorY;
  }

  private renderCertifications(
    doc: jsPDF,
    cursorY: number,
    certifications: readonly CertificationData[],
  ): number {
    for (const cert of certifications) {
      cursorY = this.checkPageBreak(doc, cursorY, 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZES.body);
      doc.text(cert.name, MARGIN, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textMuted);
      const dateText = this.fmtDate(cert.date);
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, PAGE_WIDTH - MARGIN - dateWidth, cursorY);
      cursorY += LINE_HEIGHT;

      doc.setFontSize(FONT_SIZES.small);

      if (cert.url) {
        doc.setTextColor(...COLORS.linkRgb);
        doc.textWithLink(cert.issuer, MARGIN, cursorY, { url: cert.url });
      } else {
        doc.setTextColor(COLORS.textSecondary);
        doc.text(cert.issuer, MARGIN, cursorY);
      }

      doc.setTextColor(COLORS.textDefault);
      cursorY += LINE_HEIGHT + SPACER_SM;
    }

    return cursorY;
  }

  private renderSkills(
    doc: jsPDF,
    cursorY: number,
    skills: readonly SkillCategoryData[],
  ): number {
    for (const category of skills) {
      cursorY = this.checkPageBreak(doc, cursorY, 10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${category.category}: `, MARGIN, cursorY);
      const labelWidth = doc.getTextWidth(`${category.category}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textSecondary);
      const skillLines = doc.splitTextToSize(
        category.skills.join(', '),
        CONTENT_WIDTH - labelWidth,
      ) as string[];
      doc.text(skillLines, MARGIN + labelWidth, cursorY);
      cursorY += Math.max(skillLines.length, 1) * LINE_HEIGHT;
      doc.setTextColor(COLORS.textDefault);
    }

    return cursorY;
  }

  private renderLanguages(
    doc: jsPDF,
    cursorY: number,
    languages: readonly LanguageData[],
  ): number {
    const text = languages
      .map((lang) => `${lang.language} — ${lang.proficiency}`)
      .join('    ');
    doc.text(text, MARGIN, cursorY);

    return cursorY + LINE_HEIGHT;
  }

  private renderBody(doc: jsPDF, cursorY: number, text: string): number {
    doc.setTextColor(COLORS.textBody);
    cursorY = this.textJustified(doc, cursorY, text, MARGIN, CONTENT_WIDTH);
    doc.setTextColor(COLORS.textDefault);

    return cursorY;
  }

  private textJustified(
    doc: jsPDF,
    cursorY: number,
    text: string,
    x: number,
    width: number,
  ): number {
    const lines = doc.splitTextToSize(text, width) as string[];

    for (const [idx, line] of lines.entries()) {
      cursorY = this.checkPageBreak(doc, cursorY, LINE_HEIGHT);
      const isLast = idx === lines.length - 1;
      const words = line.split(/\s+/).filter(Boolean);

      if (isLast || words.length <= 1) {
        doc.text(line, x, cursorY);
      } else {
        const wordsWidth = words.reduce(
          (sum, word) => sum + doc.getTextWidth(word),
          0,
        );
        const gap = (width - wordsWidth) / (words.length - 1);
        let cx = x;

        for (const word of words) {
          doc.text(word, cx, cursorY);
          cx += doc.getTextWidth(word) + gap;
        }
      }

      cursorY += LINE_HEIGHT - 1;
    }

    return cursorY;
  }

  private fmtDate(value: string | undefined): string {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) {
      return value ?? 'Present';
    }

    const [year, month] = value.split('-').map(Number);
    const date = new Date(year, month - 1, 1);

    return DATE_FORMATTER.format(date);
  }

  private checkPageBreak(doc: jsPDF, cursorY: number, needed: number): number {
    if (cursorY + needed > PAGE_BOTTOM_LIMIT) {
      doc.addPage();

      return MARGIN;
    }

    return cursorY;
  }
}
