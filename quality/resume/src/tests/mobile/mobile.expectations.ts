export class MobileViewportExpectations {
  static readonly noHorizontalOverflow =
    'not scroll horizontally at mobile viewport width';
  static readonly stackSidebarBelowContent =
    'stack sidebar below main content instead of side-by-side';
  static readonly showSidebarContact =
    'show sidebar contact and name in the stacked mobile layout';
  static readonly showExperienceSection =
    'show experience section content at mobile width';
  static readonly showSkillsSection =
    'show skills section content at mobile width';
  static readonly expandActionHub =
    'expand the floating action hub on trigger tap';
  static readonly collapseActionHub =
    'collapse the floating action hub on Escape';
  static readonly actionHubWithinViewport =
    'keep the action hub panel fully within the viewport bounds';
  static readonly toggleTheme = 'toggle dark theme from the mobile action hub';
  static readonly showLinkedInCtaInPublicView =
    'show the LinkedIn CTA instead of download in public view';
  static readonly showDownloadButton =
    'show a reachable download button in private view';
  static readonly downloadPdfOnTap = 'download a PDF file on tap';
}

export class MobileLayoutIntegrityExpectations {
  static readonly noBodyOverflow =
    'keep document scrollWidth within the viewport clientWidth';
  static readonly jumbotronWithinViewport =
    'keep the jumbotron within the viewport width';
  static readonly sidebarWithinViewport =
    'keep the profile sidebar within the viewport width';
  static readonly mainContentWithinViewport =
    'keep the main content within the viewport width';
  static readonly floatingActionsWithinViewport =
    'keep the floating actions trigger within the viewport bounds';
  static readonly experienceItemsWithinViewport =
    'keep experience items within the viewport width';
}
