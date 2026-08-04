import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
  standalone: true,
  pure: true,
})
export class FormatDatePipe implements PipeTransform {
  private static readonly formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  });

  transform(value: { year: number; month: number } | undefined): string {
    if (!value) {
      return 'Present';
    }

    const date = new Date(value.year, value.month - 1, 1);

    return FormatDatePipe.formatter.format(date);
  }
}
