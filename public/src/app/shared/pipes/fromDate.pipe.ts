import { Pipe, PipeTransform } from '@angular/core';
import { DateFunctions } from '../helpers/date-service';


@Pipe({name: 'fromNow'})
export class FromNowDatePipe implements PipeTransform {
  transform(value: string): string {
    return DateFunctions.from(value);
  }
}