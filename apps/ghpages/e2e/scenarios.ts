export const enum SeoScenario {
  ContainsMetaDescription = "prerendered HTML contains meta description",
  ContainsPageTitle = "prerendered HTML contains page title",
  ContainsSidebarSections = "prerendered HTML contains portfolio sidebar sections",
  ExcludesInteractiveHero = "prerendered HTML excludes interactive hero content",
  ExcludesClientOnlyContent = "prerendered HTML excludes canvas and typewriter",
  ExcludesPrivateData = "prerendered HTML excludes private email and phone",
}

export const enum HeroScenario {
  MountsInBrowser = "interactive hero mounts in browser after bootstrap",
  CanvasAttached = "particle canvas is present when hero is visible",
  ScrollIndicatorScrolls = "scroll indicator clicks and scrolls to portfolio",
  UnmountsOnScroll = "hero unmounts from DOM when scrolled past",
  RemountsOnScrollBack = "hero remounts when scrolling back to top",
}

export const enum PrivateScenario {
  RevealsEmail = "reveals private email with valid payload",
  RevealsPhone = "reveals private phone as clickable tel link",
  EnablesPdfButton = "shows enabled PDF download button",
  ShowsSnackbarOnInvalidHash = "shows snackbar for invalid hash payload",
  DismissesSnackbar = "auto-dismisses snackbar after timeout",
}
