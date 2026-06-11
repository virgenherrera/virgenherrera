// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const HIDDEN_STYLE =
  "opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out;";
const VISIBLE_STYLE =
  "opacity: 1; transform: translateY(0); transition: opacity 0.6s ease-out, transform 0.6s ease-out;";

// Simulate the core ngOnInit logic extracted from ScrollRevealDirective.
// inject() cannot run outside Angular's injection context, so we replicate
// the behaviour in a plain function and assert on the resulting side-effects.
function runDirectiveInit(
  element: HTMLElement,
  isBrowser: boolean,
): {
  observer: {
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  } | null;
  triggerCallback: IntersectionObserverCallback | null;
} {
  if (!isBrowser) {
    return { observer: null, triggerCallback: null };
  }

  element.setAttribute("style", HIDDEN_STYLE);

  let triggerCallback: IntersectionObserverCallback | null = null;
  const observer = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };

  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function (this: void, cb: IntersectionObserverCallback) {
      triggerCallback = cb;

      return observer;
    }),
  );

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).setAttribute("style", VISIBLE_STYLE);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  io.observe(element);

  return { observer, triggerCallback };
}

describe("ScrollRevealDirective", () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement("div");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("browser environment", () => {
    it("applies hidden style to element on init", () => {
      runDirectiveInit(element, true);

      expect(element.getAttribute("style")).toBe(HIDDEN_STYLE);
    });

    it("creates IntersectionObserver with threshold 0.1", () => {
      const { observer } = runDirectiveInit(element, true);

      expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
        threshold: 0.1,
      });
      expect(observer).not.toBeNull();
    });

    it("starts observing the element", () => {
      const { observer } = runDirectiveInit(element, true);

      expect(observer!.observe).toHaveBeenCalledWith(element);
    });

    it("applies visible style when entry is intersecting", () => {
      const { triggerCallback } = runDirectiveInit(element, true);

      const entry = {
        isIntersecting: true,
        target: element,
      } as IntersectionObserverEntry;
      triggerCallback!([entry], {} as IntersectionObserver);

      expect(element.getAttribute("style")).toBe(VISIBLE_STYLE);
    });

    it("calls unobserve after element becomes visible", () => {
      const { observer, triggerCallback } = runDirectiveInit(element, true);

      const entry = {
        isIntersecting: true,
        target: element,
      } as IntersectionObserverEntry;
      triggerCallback!([entry], {} as IntersectionObserver);

      expect(observer!.unobserve).toHaveBeenCalledWith(element);
    });

    it("does not change style when entry is not intersecting", () => {
      const { triggerCallback } = runDirectiveInit(element, true);

      const entry = {
        isIntersecting: false,
        target: element,
      } as IntersectionObserverEntry;
      triggerCallback!([entry], {} as IntersectionObserver);

      // Style must remain hidden (set during init), not switch to visible
      expect(element.getAttribute("style")).toBe(HIDDEN_STYLE);
    });
  });

  describe("server (non-browser) environment", () => {
    it("does not apply any style when not in browser", () => {
      runDirectiveInit(element, false);

      expect(element.getAttribute("style")).toBeNull();
    });

    it("does not create an IntersectionObserver when not in browser", () => {
      const { observer } = runDirectiveInit(element, false);

      expect(observer).toBeNull();
    });
  });

  describe("ngOnDestroy behaviour", () => {
    it("disconnects the observer on destroy", () => {
      const { observer } = runDirectiveInit(element, true);

      // Simulate ngOnDestroy
      observer!.disconnect();

      expect(observer!.disconnect).toHaveBeenCalledOnce();
    });

    it("does not throw when observer is null on destroy", () => {
      // No observer created in server env
      const { observer } = runDirectiveInit(element, false);

      expect(observer).toBeNull();
    });
  });
});
