import { FormatDatePipe } from './format-date.pipe';

describe('UT: FormatDatePipe @smoke', () => {
  let pipe: FormatDatePipe;

  beforeEach(() => {
    pipe = new FormatDatePipe();
  });

  class should {
    static readonly returnPresentForUndefined =
      'return "Present" when value is undefined';
    static readonly formatJanuary =
      'format { year: 2024, month: 1 } as "Jan 2024"';
    static readonly formatDecember =
      'format { year: 2023, month: 12 } as "Dec 2023"';
    static readonly formatJune =
      'format { year: 2020, month: 6 } as "Jun 2020"';
    static readonly formatFebruary =
      'format { year: 2019, month: 2 } as "Feb 2019"';
    static readonly handleAllMonths =
      'produce distinct formatted output for all 12 months';
  }

  it(should.returnPresentForUndefined, () => {
    expect(pipe.transform(undefined)).toBe('Present');
  });

  it(should.formatJanuary, () => {
    expect(pipe.transform({ year: 2024, month: 1 })).toBe('Jan 2024');
  });

  it(should.formatDecember, () => {
    expect(pipe.transform({ year: 2023, month: 12 })).toBe('Dec 2023');
  });

  it(should.formatJune, () => {
    expect(pipe.transform({ year: 2020, month: 6 })).toBe('Jun 2020');
  });

  it(should.formatFebruary, () => {
    expect(pipe.transform({ year: 2019, month: 2 })).toBe('Feb 2019');
  });

  it(should.handleAllMonths, () => {
    const results = new Set<string>();

    for (let m = 1; m <= 12; m++) {
      const output = pipe.transform({ year: 2024, month: m });

      expect(output).toContain('2024');
      results.add(output);
    }

    expect(results.size).toBe(12);
  });
});
