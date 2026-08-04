import { ICON_PATHS, isIconName, type IconName } from './icon-paths.constant';

describe('UT: icon-paths @smoke', () => {
  const EXPECTED_ICONS: IconName[] = [
    'mail',
    'phone',
    'gitHub',
    'linkedIn',
    'globe',
    'download',
    'sun',
    'moon',
    'close',
    'kebab',
  ];

  class should {
    static readonly exportAllExpectedIcons = 'export all expected icon names';
    static readonly haveNonEmptySvgPaths =
      'have non-empty SVG path strings for every icon';
    static readonly recognizeValidIconNames =
      'return true for valid icon names via isIconName';
    static readonly rejectInvalidNames =
      'return false for invalid strings via isIconName';
  }

  it(should.exportAllExpectedIcons, () => {
    for (const icon of EXPECTED_ICONS) {
      expect(ICON_PATHS).toHaveProperty(icon);
    }
  });

  it(should.haveNonEmptySvgPaths, () => {
    for (const [, path] of Object.entries(ICON_PATHS)) {
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    }
  });

  it(should.recognizeValidIconNames, () => {
    for (const icon of EXPECTED_ICONS) {
      expect(isIconName(icon)).toBe(true);
    }
  });

  it(should.rejectInvalidNames, () => {
    expect(isIconName('nonexistent')).toBe(false);
    expect(isIconName('')).toBe(false);
    expect(isIconName('MAIL')).toBe(false);
  });
});
