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
  static readonly haveOgTitle = 'have og:title matching "{name} — {role}"';
  static readonly haveOgDescription = 'have og:description under 155 chars';
  static readonly haveOgUrl = 'have og:url pointing to the site URL';
  static readonly haveOgType = 'have og:type set to "profile"';
  static readonly haveOgImage = 'have og:image pointing to avatar.jpg';
  static readonly haveOgImageDimensions =
    'have og:image:width and og:image:height set to 528';
  static readonly haveTwitterCard = 'have twitter:card set to "summary"';
  static readonly haveTwitterTitle = 'have twitter:title present';
  static readonly haveTwitterImage =
    'have twitter:image pointing to avatar.jpg';
  static readonly haveOgLocale = 'have og:locale set to "en_US"';
  static readonly haveImageAltText =
    'have og:image:alt and twitter:image:alt containing the profile name';
  static readonly notLeakPiiInSocialMeta =
    'not leak PII (email/phone) in Open Graph or Twitter meta tags';
  static readonly haveJsonLdScript =
    'have a JSON-LD script tag in prerendered HTML';
  static readonly havePersonType = 'have @type set to "Person"';
  static readonly haveJsonLdName = "have name matching the profile's name";
  static readonly haveJsonLdUrl = 'have url pointing to the site URL';
  static readonly haveJsonLdImage = 'have image pointing to avatar.jpg';
  static readonly haveJsonLdJobTitle =
    "have jobTitle matching the profile's headline";
  static readonly haveJsonLdWorksFor =
    "have worksFor.name matching the current employer's company";
  static readonly haveJsonLdAlumniOf =
    'have alumniOf as an array matching education entries';
  static readonly haveJsonLdKnowsAbout =
    'have knowsAbout as an array of skill names';
  static readonly haveJsonLdHasCredentialGuarded =
    'have hasCredential present only when certifications exist';
  static readonly haveJsonLdKnowsLanguage =
    'have knowsLanguage as an array of language names';
  static readonly notLeakPiiInJsonLd =
    'not leak PII (email/phone) in JSON-LD structured data';
  static readonly matchJsonLdBetweenSsgAndCsr =
    'produce equivalent JSON-LD structured data between SSG and CSR';
  static readonly matchCanonicalOgUrlAndJsonLdUrl =
    'have matching canonical link, og:url, and JSON-LD url';
}
