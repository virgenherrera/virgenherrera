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
    'have a JSON-LD script tag after hydration';
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
}
