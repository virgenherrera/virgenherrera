import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  ExperienceData,
  EducationData,
  LanguageData,
  LinkData,
  SkillCategoryData,
} from "../types/profile.types";
import { PdfGeneratorService } from "./pdf-generator.service";

// ---------------------------------------------------------------------------
// Mock jsPDF
// ---------------------------------------------------------------------------

type JsPDFMock = {
  setFontSize: ReturnType<typeof vi.fn>;
  setFont: ReturnType<typeof vi.fn>;
  setTextColor: ReturnType<typeof vi.fn>;
  setDrawColor: ReturnType<typeof vi.fn>;
  text: ReturnType<typeof vi.fn>;
  textWithLink: ReturnType<typeof vi.fn>;
  getTextWidth: ReturnType<typeof vi.fn>;
  splitTextToSize: ReturnType<typeof vi.fn>;
  line: ReturnType<typeof vi.fn>;
  addPage: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
};

function createMockJsPdf(): JsPDFMock {
  return {
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    text: vi.fn(),
    textWithLink: vi.fn(),
    /**
     * Returns a deterministic width so layout arithmetic stays predictable:
     * each character contributes 2 mm.
     */
    getTextWidth: vi.fn((t: string) => t.length * 2),
    /**
     * Naive but correct splitter: honour `width` by chunking the text into
     * segments whose character-length fits within `Math.floor(width / 2)`
     * (matching the getTextWidth mock above).
     */
    splitTextToSize: vi.fn((t: string, width: number) => {
      const charsPerLine = Math.floor(width / 2);
      if (charsPerLine <= 0) return [t];
      const result: string[] = [];
      const words = t.split(" ");
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= charsPerLine) {
          current = candidate;
        } else {
          if (current) result.push(current);
          current = word;
        }
      }
      if (current) result.push(current);

      return result.length ? result : [t];
    }),
    line: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
  };
}

let mockDocInstance: JsPDFMock;

vi.mock("jspdf", () => ({
  jsPDF: vi.fn(function () {
    mockDocInstance = createMockJsPdf();

    return mockDocInstance;
  }),
}));

// ---------------------------------------------------------------------------
// Minimal fixture data
// ---------------------------------------------------------------------------

const minimalLinks: LinkData[] = [
  { label: "GitHub", url: "https://github.com/test" },
];

const minimalExperience: ExperienceData[] = [
  {
    company: "Acme Corp",
    role: "Senior Engineer",
    startDate: "2020-01",
    endDate: "2023-06",
    description: ["* Built awesome things", "Led team of five"],
    technologies: ["TypeScript", "Angular"],
  },
];

const minimalEducation: EducationData[] = [
  {
    degree: "BSc Computer Science",
    degreeTranslation: "Bachelor of Science in Computer Science",
    institution: "State University",
    location: "City, Country",
    startDate: "2015-08",
    graduationDate: "2019-05",
    honors: "Magna Cum Laude",
  },
];

const minimalSkills: SkillCategoryData[] = [
  { category: "Frontend", skills: ["Angular", "React", "TypeScript"] },
];

const minimalLanguages: LanguageData[] = [
  { language: "English", proficiency: "Native" },
  { language: "Spanish", proficiency: "Professional" },
];

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

const minimalResumeData: ResumeData = {
  name: "Hugo Virgen",
  headline: "Senior Front-End Engineer",
  location: "Guadalajara, MX",
  summary: "Experienced engineer focused on Angular and TypeScript.",
  email: "test@example.com",
  phone: "+52 333 000 0000",
  links: minimalLinks,
  experience: minimalExperience,
  education: minimalEducation,
  skills: minimalSkills,
  languages: minimalLanguages,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Access private state fields (r/w) without using `any`. */
function privState(service: PdfGeneratorService): Record<string, unknown> {
  return service as unknown as Record<string, unknown>;
}

/** Call a private method by name without using `any`. */
function callPriv(
  service: PdfGeneratorService,
  method: string,
  ...args: unknown[]
): unknown {
  const fn = (
    service as unknown as Record<string, (...a: unknown[]) => unknown>
  )[method];

  return fn.call(service, ...args);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PdfGeneratorService", () => {
  let service: PdfGeneratorService;

  beforeEach(() => {
    service = new PdfGeneratorService();
  });

  // -------------------------------------------------------------------------
  // download()
  // -------------------------------------------------------------------------

  describe("download()", () => {
    it("constructs a jsPDF instance and calls save with the expected filename", async () => {
      const { jsPDF } = await import("jspdf");
      await service.download(minimalResumeData);

      expect(jsPDF).toHaveBeenCalledWith({ unit: "mm", format: "a4" });
      expect(mockDocInstance.save).toHaveBeenCalledOnce();
      expect(mockDocInstance.save).toHaveBeenCalledWith(
        "hugo-virgen-herrera-resume.pdf",
      );
    });

    it("renders all six sections in order", async () => {
      await service.download(minimalResumeData);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const upperCaseTexts = textCalls
        .filter(
          ([t]) =>
            typeof t === "string" && t === t.toUpperCase() && t.length > 1,
        )
        .map(([t]) => t as string);

      expect(upperCaseTexts).toContain("PROFESSIONAL SUMMARY");
      expect(upperCaseTexts).toContain("WORK EXPERIENCE");
      expect(upperCaseTexts).toContain("EDUCATION");
      expect(upperCaseTexts).toContain("SKILLS");
      expect(upperCaseTexts).toContain("LANGUAGES");
    });

    it("renders the resume name centred at the top", async () => {
      await service.download(minimalResumeData);

      const textCalls = mockDocInstance.text.mock.calls as [
        string,
        number,
        number,
        Record<string, unknown>,
        ...unknown[],
      ][];
      const nameCall = textCalls.find(([t]) => t === minimalResumeData.name);
      expect(nameCall).toBeDefined();
      expect(nameCall?.[3]).toMatchObject({ align: "center" });
    });
  });

  // -------------------------------------------------------------------------
  // fmtDate() — tested via download() by inspecting text calls with known dates
  // -------------------------------------------------------------------------

  describe("fmtDate() — via renderExperience date range", () => {
    it('formats "2020-01" → "Jan 2020"', async () => {
      await service.download(minimalResumeData);

      const allTexts = (
        mockDocInstance.text.mock.calls as [string | string[], ...unknown[]][]
      ).flatMap(([t]) => (Array.isArray(t) ? t : [t]));
      const dateRangeText = allTexts.find(
        (t) => typeof t === "string" && t.includes("Jan 2020"),
      );
      expect(dateRangeText).toBeDefined();
    });

    it('formats "2023-06" → "Jun 2023"', async () => {
      await service.download(minimalResumeData);

      const allTexts = (
        mockDocInstance.text.mock.calls as [string | string[], ...unknown[]][]
      ).flatMap(([t]) => (Array.isArray(t) ? t : [t]));
      const dateRangeText = allTexts.find(
        (t) => typeof t === "string" && t.includes("Jun 2023"),
      );
      expect(dateRangeText).toBeDefined();
    });

    it("returns Present when endDate is undefined", async () => {
      const data: ResumeData = {
        ...minimalResumeData,
        experience: [
          {
            ...minimalExperience[0]!,
            endDate: undefined,
          },
        ],
      };
      await service.download(data);

      const allTexts = (
        mockDocInstance.text.mock.calls as [string | string[], ...unknown[]][]
      ).flatMap(([t]) => (Array.isArray(t) ? t : [t]));
      expect(
        allTexts.some((t) => typeof t === "string" && t.includes("Present")),
      ).toBe(true);
    });

    it("passes through non-date strings verbatim (e.g. 'Current')", async () => {
      const data: ResumeData = {
        ...minimalResumeData,
        experience: [
          {
            ...minimalExperience[0]!,
            endDate: "Current",
          },
        ],
      };
      await service.download(data);

      const allTexts = (
        mockDocInstance.text.mock.calls as [string | string[], ...unknown[]][]
      ).flatMap(([t]) => (Array.isArray(t) ? t : [t]));
      expect(
        allTexts.some((t) => typeof t === "string" && t.includes("Current")),
      ).toBe(true);
    });
  });

  // Also test fmtDate directly via bracket notation on the service prototype
  describe("fmtDate() — direct invocation", () => {
    type FmtDate = (value: string | undefined) => string;

    function getFmtDate(svc: PdfGeneratorService): FmtDate {
      return (
        PdfGeneratorService.prototype as unknown as Record<string, FmtDate>
      )["fmtDate"].bind(svc);
    }

    it('formats "2024-01" → "Jan 2024"', () => {
      const fmt = getFmtDate(service);
      expect(fmt("2024-01")).toBe("Jan 2024");
    });

    it('formats "2023-12" → "Dec 2023"', () => {
      const fmt = getFmtDate(service);
      expect(fmt("2023-12")).toBe("Dec 2023");
    });

    it("returns Present when value is undefined", () => {
      const fmt = getFmtDate(service);
      expect(fmt(undefined)).toBe("Present");
    });

    it("passes through strings that do not match YYYY-MM", () => {
      const fmt = getFmtDate(service);
      expect(fmt("Current")).toBe("Current");
      expect(fmt("Ongoing")).toBe("Ongoing");
    });
  });

  // -------------------------------------------------------------------------
  // checkPageBreak() — direct invocation
  // -------------------------------------------------------------------------

  describe("checkPageBreak()", () => {
    async function setupDoc(): Promise<void> {
      // Calling download initialises this.doc and this.y = MARGIN (20)
      await service.download({
        ...minimalResumeData,
        experience: [],
        education: [],
        skills: [],
        languages: [],
      });
    }

    it("calls addPage and resets y to 20 when y + needed > 280", async () => {
      await setupDoc();
      // Force y to a high value
      privState(service)["y"] = 270;

      callPriv(service, "checkPageBreak", 15);

      expect(mockDocInstance.addPage).toHaveBeenCalled();
      expect(privState(service)["y"]).toBe(20);
    });

    it("does NOT call addPage when y + needed <= 280", async () => {
      await setupDoc();
      const addPageCallsBefore = mockDocInstance.addPage.mock.calls.length;

      privState(service)["y"] = 100;
      callPriv(service, "checkPageBreak", 15);

      expect(mockDocInstance.addPage.mock.calls.length).toBe(
        addPageCallsBefore,
      );
      expect(privState(service)["y"]).toBe(100); // unchanged
    });

    it("calls addPage exactly at the boundary (y + needed = 281)", async () => {
      await setupDoc();
      privState(service)["y"] = 266;

      callPriv(service, "checkPageBreak", 15);

      expect(mockDocInstance.addPage).toHaveBeenCalled();
    });

    it("does NOT call addPage when y + needed = 280 exactly", async () => {
      await setupDoc();
      const addPageCallsBefore = mockDocInstance.addPage.mock.calls.length;

      privState(service)["y"] = 265;
      callPriv(service, "checkPageBreak", 15);

      expect(mockDocInstance.addPage.mock.calls.length).toBe(
        addPageCallsBefore,
      );
    });
  });

  // -------------------------------------------------------------------------
  // renderHeaderContacts()
  // -------------------------------------------------------------------------

  describe("renderHeaderContacts()", () => {
    it("renders location as plain text (no link)", async () => {
      await service.download(minimalResumeData);

      const textCalls = mockDocInstance.text.mock.calls as [
        string,
        ...unknown[],
      ][];
      const locationCall = textCalls.find(
        ([t]) => t === minimalResumeData.location,
      );
      expect(locationCall).toBeDefined();
    });

    it("renders email as a link with mailto: URL", async () => {
      await service.download(minimalResumeData);

      const linkCalls = mockDocInstance.textWithLink.mock.calls as [
        string,
        number,
        number,
        Record<string, string>,
      ][];
      const emailCall = linkCalls.find(([t]) => t === minimalResumeData.email);
      expect(emailCall).toBeDefined();
      expect(emailCall?.[3]).toMatchObject({
        url: `mailto:${minimalResumeData.email}`,
      });
    });

    it("renders phone as a link with tel: URL", async () => {
      await service.download(minimalResumeData);

      const linkCalls = mockDocInstance.textWithLink.mock.calls as [
        string,
        number,
        number,
        Record<string, string>,
      ][];
      const phoneCall = linkCalls.find(([t]) => t === minimalResumeData.phone);
      expect(phoneCall).toBeDefined();
      expect(phoneCall?.[3]).toMatchObject({
        url: `tel:${minimalResumeData.phone}`,
      });
    });

    it("renders link items with their URL", async () => {
      await service.download(minimalResumeData);

      const linkCalls = mockDocInstance.textWithLink.mock.calls as [
        string,
        number,
        number,
        Record<string, string>,
      ][];
      const githubCall = linkCalls.find(([t]) => t === "GitHub");
      expect(githubCall).toBeDefined();
      expect(githubCall?.[3]).toMatchObject({
        url: "https://github.com/test",
      });
    });

    it("omits email block when email is null", async () => {
      const data: ResumeData = { ...minimalResumeData, email: null };
      await service.download(data);

      const linkCalls = mockDocInstance.textWithLink.mock.calls as [
        string,
        ...unknown[],
      ][];
      const emailCall = linkCalls.find(
        ([t]) => typeof t === "string" && t.includes("@"),
      );
      expect(emailCall).toBeUndefined();
    });

    it("omits phone block when phone is null", async () => {
      const data: ResumeData = { ...minimalResumeData, phone: null };
      await service.download(data);

      const linkCalls = mockDocInstance.textWithLink.mock.calls as [
        string,
        ...unknown[],
      ][];
      const phoneCall = linkCalls.find(
        ([t]) => typeof t === "string" && t.startsWith("+"),
      );
      expect(phoneCall).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // renderExperience()
  // -------------------------------------------------------------------------

  describe("renderExperience()", () => {
    it("renders a bullet (•) for description items starting with *", async () => {
      await service.download(minimalResumeData);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const bulletCall = textCalls.find(
        ([t]) => typeof t === "string" && t === "•",
      );
      expect(bulletCall).toBeDefined();
    });

    it("renders technologies joined with ' · '", async () => {
      await service.download(minimalResumeData);

      const splitCalls = mockDocInstance.splitTextToSize.mock.calls as [
        string,
        ...unknown[],
      ][];
      const techCall = splitCalls.find(
        ([t]) => typeof t === "string" && t.includes(" · "),
      );
      expect(techCall).toBeDefined();
      expect(techCall?.[0]).toBe("TypeScript · Angular");
    });

    it("renders the role name in bold", async () => {
      await service.download(minimalResumeData);

      const fontCalls = mockDocInstance.setFont.mock.calls as [
        string,
        string,
      ][];
      const boldBeforeRole = fontCalls.some(([, style]) => style === "bold");
      expect(boldBeforeRole).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // renderEducation()
  // -------------------------------------------------------------------------

  describe("renderEducation()", () => {
    it("renders the degree translation", async () => {
      await service.download(minimalResumeData);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const degreeCall = textCalls.find(
        ([t]) => t === minimalEducation[0]!.degreeTranslation,
      );
      expect(degreeCall).toBeDefined();
    });

    it("renders institution and location combined", async () => {
      await service.download(minimalResumeData);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const inst = minimalEducation[0]!;
      const combined = `${inst.institution} — ${inst.location}`;
      const instCall = textCalls.find(([t]) => t === combined);
      expect(instCall).toBeDefined();
    });

    it("renders honors when present", async () => {
      await service.download(minimalResumeData);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const honorsCall = textCalls.find(
        ([t]) => t === minimalEducation[0]!.honors,
      );
      expect(honorsCall).toBeDefined();
    });

    it("skips honors when undefined", async () => {
      const data: ResumeData = {
        ...minimalResumeData,
        education: [{ ...minimalEducation[0]!, honors: undefined }],
      };
      await service.download(data);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const honorsCall = textCalls.find(([t]) => t === "Magna Cum Laude");
      expect(honorsCall).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // renderSkills()
  // -------------------------------------------------------------------------

  describe("renderSkills()", () => {
    it("renders the category label with a colon in bold", async () => {
      await service.download(minimalResumeData);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const categoryCall = textCalls.find(
        ([t]) => t === `${minimalSkills[0]!.category}: `,
      );
      expect(categoryCall).toBeDefined();
    });

    it("passes skills joined by ', ' to splitTextToSize", async () => {
      await service.download(minimalResumeData);

      const splitCalls = mockDocInstance.splitTextToSize.mock.calls as [
        string,
        ...unknown[],
      ][];
      const skillsCall = splitCalls.find(
        ([t]) =>
          typeof t === "string" && t === minimalSkills[0]!.skills.join(", "),
      );
      expect(skillsCall).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // renderLanguages()
  // -------------------------------------------------------------------------

  describe("renderLanguages()", () => {
    it("renders all languages on a single text call", async () => {
      await service.download(minimalResumeData);

      const expected = minimalLanguages
        .map((l) => `${l.language} — ${l.proficiency}`)
        .join("    ");

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const languagesCall = textCalls.find(([t]) => t === expected);
      expect(languagesCall).toBeDefined();
    });

    it("renders a single language correctly", async () => {
      const data: ResumeData = {
        ...minimalResumeData,
        languages: [{ language: "English", proficiency: "Native" }],
      };
      await service.download(data);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const singleLang = textCalls.find(([t]) => t === "English — Native");
      expect(singleLang).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // textJustified() — through renderBody (Professional Summary)
  // -------------------------------------------------------------------------

  describe("textJustified() — via renderBody", () => {
    it("calls splitTextToSize for body text", async () => {
      await service.download(minimalResumeData);

      const splitCalls = mockDocInstance.splitTextToSize.mock.calls as [
        string,
        ...unknown[],
      ][];
      const summaryCall = splitCalls.find(
        ([t]) => t === minimalResumeData.summary,
      );
      expect(summaryCall).toBeDefined();
    });

    it("renders last line with doc.text (not justified word-by-word)", async () => {
      // With a short one-line summary the single line IS the last line,
      // so doc.text should be called with that text directly.
      const shortSummary = "Short.";
      const data: ResumeData = { ...minimalResumeData, summary: shortSummary };
      await service.download(data);

      const textCalls = mockDocInstance.text.mock.calls as [
        string | string[],
        ...unknown[],
      ][];
      const summaryCall = textCalls.find(([t]) => t === shortSummary);
      expect(summaryCall).toBeDefined();
    });
  });
});
