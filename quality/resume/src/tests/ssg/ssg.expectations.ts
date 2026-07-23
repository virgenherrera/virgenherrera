export class SsgPreRenderExpectations {
  static readonly renderPrerenderedHtml =
    'render pre-rendered HTML without JavaScript';
  static readonly displayProfileName =
    'display the profile name in the jumbotron';
  static readonly renderExperienceTimeline =
    'render experience timeline in pre-rendered HTML';
  static readonly notShowPrivateContent =
    'not show private view content or PII';
  static readonly haveJumbotronFullViewport = 'have jumbotron at 100vw x 100vh';
  static readonly haveTwoColumnLayout =
    'have 2-column layout (30% sidebar + 70% content)';
  static readonly haveFlexContainer = 'have flex display on content area';
  static readonly showProfileInSidebar =
    'show profile name and skills in sidebar';
  static readonly showExperienceItems = 'show experience items in main content';
  static readonly renderThemeToggle =
    'render theme toggle button in pre-rendered HTML';
  static readonly serveGoogleVerificationFile =
    'serve Google Search Console verification file at expected URL';
  static readonly renderAboutSection =
    'render About section with truncated summary text';
  static readonly showPublicContactLinks =
    'show public contact links in sidebar';
  static readonly haveStickyPositionOnSidebar =
    'have sticky position on sidebar for scroll tracking';
  static readonly notPreRenderDownloadButton =
    'not include download button in pre-rendered HTML';
  static readonly loadAllResourcesWithoutErrors =
    'load all page resources without HTTP errors';
  static readonly renderAllImagesSuccessfully =
    'render all images with valid dimensions';
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
