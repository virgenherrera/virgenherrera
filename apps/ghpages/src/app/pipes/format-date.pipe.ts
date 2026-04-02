import { Pipe, type PipeTransform } from "@angular/core";
import { parse, format } from "date-fns";

@Pipe({
  name: "formatDate",
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  transform(value: string, pattern = "MMM yyyy"): string {
    const date = parse(value, "yyyy-MM", new Date());

    return format(date, pattern);
  }
}
