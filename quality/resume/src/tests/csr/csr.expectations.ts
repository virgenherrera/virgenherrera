export class ClientHydrationExpectations {
  static readonly showPublicByDefault = 'show public view by default (no hash)';
  static readonly activatePrivateView = 'activate private view with valid hash';
  static readonly stayPublicOnInvalidHash =
    'stay in public view when hash is invalid';
  static readonly revertToPublicOnClear =
    'revert to public view when hash is cleared';
  static readonly displayPrivateContact =
    'display contact section in private view';
  static readonly displayFullExperience =
    'display full experience in private view';
  static readonly showExperienceAfterHydration =
    'show experience items after hydration';
  static readonly toggleToDarkTheme = 'toggle to dark theme on click';
  static readonly toggleBackToLightTheme =
    'toggle back to light theme on second click';
  static readonly keepThemeToggleVisibleOnScroll =
    'keep theme toggle visible after scrolling past jumbotron';
  static readonly applyDarkBackgroundToBody =
    'apply dark background to body in dark mode';
  static readonly differentiateSidebarFromPage =
    'differentiate sidebar surface from page background in dark mode';
  static readonly showPublicContactLinksDefault =
    'show public contact links (GitHub, LinkedIn) by default';
  static readonly addPrivateContactsWithHash =
    'add email and phone contact links in private view';
  static readonly renderContactIcons =
    'render SVG icons in contact CTA buttons';
  static readonly applyBlankTargetOnExternalLinks =
    'apply target="_blank" on external links';
  static readonly noTargetOnTelLinks = 'not apply target on tel: links';
  static readonly expandAboutWithShowMore =
    'expand About text with Show more button in private view';
  static readonly collapseAboutWithShowLess =
    'collapse About text with Show less button';
  static readonly applyStickyPositionOnSidebar =
    'apply sticky position on sidebar';
  static readonly hideDownloadInPublicView =
    'show LinkedIn CTA instead of download button in public view';
  static readonly showDownloadInPrivateView =
    'show download button in private view';
  static readonly downloadPdfOnClick = 'download PDF file on click';
  static readonly downloadValidPdf =
    'download a valid PDF with correct content';
  static readonly navigateToDownloadWithKeyboard =
    'navigate to download button and trigger with keyboard';
  static readonly expandActionHub = 'expand action hub on trigger click';
  static readonly collapseActionHub = 'collapse action hub on Escape key';
  static readonly showLinkedInCtaInPublicView =
    'show LinkedIn CTA in public view';
  static readonly showTooltipOnHover = 'show tooltip on action item hover';
  static readonly haveDynamicTitle =
    'have dynamic title matching "{name} — {role}"';
  static readonly haveMetaDescription =
    'have meta description under 155 chars, prefix of profile summary';
  static readonly haveCanonicalLink =
    'have canonical link pointing to the site URL';
  static readonly serveSitemap = 'serve sitemap.xml with exactly one loc entry';
  static readonly haveRobotsMeta =
    'have robots meta allowing indexing and following';
  static readonly notLeakPiiInHead =
    'not leak PII (email/phone) in prerendered head';
}
