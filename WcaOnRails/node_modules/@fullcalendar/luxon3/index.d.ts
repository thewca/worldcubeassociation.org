import { CalendarApi, Duration, PluginDef } from '@fullcalendar/core';
import { DateTime, Duration as Duration$1 } from 'luxon';

declare function toLuxonDateTime(date: Date, calendar: CalendarApi): DateTime;
declare function toLuxonDuration(duration: Duration, calendar: CalendarApi): Duration$1;

declare const _default: PluginDef;
//# sourceMappingURL=index.d.ts.map

export { _default as default, toLuxonDateTime, toLuxonDuration };
