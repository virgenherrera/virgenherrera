export class ParticleCanvasExpectations {
  static readonly renderInJumbotron =
    'render canvas element inside jumbotron with non-zero dimensions';
  static readonly renderDots =
    'have painted content (non-blank pixel data) after initial render';
  static readonly matchLightBaseline =
    'match visual regression baseline in light theme';
  static readonly matchDarkBaseline =
    'match visual regression baseline in dark theme';
  static readonly updateOnThemeToggle =
    'update canvas pixel data when theme toggles from light to dark';
}
