import { parseDescription, type DescriptionBlock } from './description-block';

describe('UT: description-block', () => {
  class should {
    static readonly parseSingleParagraph = 'parse a single paragraph line';
    static readonly parseSingleBullet = 'parse a single bullet line';
    static readonly parseMultipleParagraphs =
      'parse multiple paragraph lines into separate blocks';
    static readonly parseConsecutiveBullets =
      'group consecutive bullet lines into one block';
    static readonly parseMixedContent =
      'parse mixed paragraphs and bullets into correct block types';
    static readonly returnEmptyForEmptyInput =
      'return an empty array for empty input';
    static readonly stripBulletPrefix =
      'strip the leading asterisk and trim whitespace from bullet lines';
    static readonly preserveWhitespaceInParagraphs =
      'preserve leading/trailing whitespace in paragraph lines';
    static readonly handleSpecialCharacters =
      'handle special characters in both paragraphs and bullets';
    static readonly startNewBulletGroupAfterParagraph =
      'start a new bullet group after an intervening paragraph';
  }

  describe('basic parsing @smoke', () => {
    it(`${should.parseSingleParagraph}`, () => {
      const result = parseDescription(['Hello world']);

      expect(result).toEqual<DescriptionBlock[]>([
        { type: 'paragraph', lines: ['Hello world'] },
      ]);
    });

    it(`${should.parseSingleBullet}`, () => {
      const result = parseDescription(['*Bullet item']);

      expect(result).toEqual<DescriptionBlock[]>([
        { type: 'bullets', lines: ['Bullet item'] },
      ]);
    });

    it(`${should.parseMultipleParagraphs}`, () => {
      const result = parseDescription(['First paragraph', 'Second paragraph']);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<DescriptionBlock>({
        type: 'paragraph',
        lines: ['First paragraph'],
      });
      expect(result[1]).toEqual<DescriptionBlock>({
        type: 'paragraph',
        lines: ['Second paragraph'],
      });
    });

    it(`${should.parseConsecutiveBullets}`, () => {
      const result = parseDescription(['*First bullet', '*Second bullet']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual<DescriptionBlock>({
        type: 'bullets',
        lines: ['First bullet', 'Second bullet'],
      });
    });
  });

  describe('edge cases @critical', () => {
    it(`${should.returnEmptyForEmptyInput}`, () => {
      const result = parseDescription([]);

      expect(result).toEqual([]);
    });

    it(`${should.parseMixedContent}`, () => {
      const result = parseDescription([
        'Intro paragraph',
        '*Bullet one',
        '*Bullet two',
        'Another paragraph',
        '*Bullet three',
      ]);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual<DescriptionBlock>({
        type: 'paragraph',
        lines: ['Intro paragraph'],
      });
      expect(result[1]).toEqual<DescriptionBlock>({
        type: 'bullets',
        lines: ['Bullet one', 'Bullet two'],
      });
      expect(result[2]).toEqual<DescriptionBlock>({
        type: 'paragraph',
        lines: ['Another paragraph'],
      });
      expect(result[3]).toEqual<DescriptionBlock>({
        type: 'bullets',
        lines: ['Bullet three'],
      });
    });

    it(`${should.startNewBulletGroupAfterParagraph}`, () => {
      const result = parseDescription([
        '*First group',
        'Paragraph break',
        '*Second group',
      ]);

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('bullets');
      expect(result[0].lines).toEqual(['First group']);
      expect(result[1].type).toBe('paragraph');
      expect(result[2].type).toBe('bullets');
      expect(result[2].lines).toEqual(['Second group']);
    });
  });

  describe('whitespace and special characters', () => {
    it(`${should.stripBulletPrefix}`, () => {
      const result = parseDescription(['*  Lots of spaces']);

      expect(result[0].lines[0]).toBe('Lots of spaces');
    });

    it(`${should.preserveWhitespaceInParagraphs}`, () => {
      const result = parseDescription(['  Leading whitespace  ']);

      expect(result[0]).toEqual<DescriptionBlock>({
        type: 'paragraph',
        lines: ['  Leading whitespace  '],
      });
    });

    it(`${should.handleSpecialCharacters}`, () => {
      const result = parseDescription([
        'Uses TypeScript & Node.js (v20+)',
        '*Implemented <T extends Base> generics',
        '*Used $interpolation and @decorators',
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].lines[0]).toBe('Uses TypeScript & Node.js (v20+)');
      expect(result[1].lines).toEqual([
        'Implemented <T extends Base> generics',
        'Used $interpolation and @decorators',
      ]);
    });
  });
});
