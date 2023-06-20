import * as dayjs from 'dayjs';

import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import * as relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export class DateFunctions {
    static from(date: string) {
        return dayjs(date).fromNow();
    }
}