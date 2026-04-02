import { Pipe, type PipeTransform } from "@angular/core";
import { parse, format } from "date-fns";

const DATE_PATTERN = /^\d{4}-\d{2}$/;

@Pipe({
  name: "formatDate",
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  transform(value: string | null | undefined, pattern = "MMM yyyy"): string {
    if (!value || !DATE_PATTERN.test(value)) {
      return value ?? "Present";
    }

    return format(parse(value, "yyyy-MM", new Date()), pattern);
  }
}
