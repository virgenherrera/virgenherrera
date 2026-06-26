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

  transform(value: string | undefined): string {
    if (!value) {
      return 'Present';
    }

    const [year, month] = value.split('-').map(Number);
    const date = new Date(year, month - 1, 1);

    return FormatDatePipe.formatter.format(date);
  }
}
