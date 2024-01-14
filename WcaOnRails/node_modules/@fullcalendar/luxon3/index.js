import { createPlugin } from '@fullcalendar/core/index.js';
import { DateTime, Duration } from 'luxon';
import { CalendarImpl, NamedTimeZoneImpl } from '@fullcalendar/core/internal.js';

function toLuxonDateTime(date, calendar) {
    if (!(calendar instanceof CalendarImpl)) {
        throw new Error('must supply a CalendarApi instance');
    }
    let { dateEnv } = calendar.getCurrentData();
    return DateTime.fromJSDate(date, {
        zone: dateEnv.timeZone,
        locale: dateEnv.locale.codes[0],
    });
}
function toLuxonDuration(duration, calendar) {
    if (!(calendar instanceof CalendarImpl)) {
        throw new Error('must supply a CalendarApi instance');
    }
    let { dateEnv } = calendar.getCurrentData();
    return Duration.fromObject(duration, {
        locale: dateEnv.locale.codes[0],
    });
}
// Internal Utils
function luxonToArray(datetime) {
    return [
        datetime.year,
        datetime.month - 1,
        datetime.day,
        datetime.hour,
        datetime.minute,
        datetime.second,
        datetime.millisecond,
    ];
}
function arrayToLuxon(arr, timeZone, locale) {
    return DateTime.fromObject({
        year: arr[0],
        month: arr[1] + 1,
        day: arr[2],
        hour: arr[3],
        minute: arr[4],
        second: arr[5],
        millisecond: arr[6],
    }, {
        locale,
        zone: timeZone,
    });
}

class LuxonNamedTimeZone extends NamedTimeZoneImpl {
    offsetForArray(a) {
        return arrayToLuxon(a, this.timeZoneName).offset;
    }
    timestampToArray(ms) {
        return luxonToArray(DateTime.fromMillis(ms, {
            zone: this.timeZoneName,
        }));
    }
}

function formatWithCmdStr(cmdStr, arg) {
    let cmd = parseCmdStr(cmdStr);
    if (arg.end) {
        let start = arrayToLuxon(arg.start.array, arg.timeZone, arg.localeCodes[0]);
        let end = arrayToLuxon(arg.end.array, arg.timeZone, arg.localeCodes[0]);
        return formatRange(cmd, start.toFormat.bind(start), end.toFormat.bind(end), arg.defaultSeparator);
    }
    return arrayToLuxon(arg.date.array, arg.timeZone, arg.localeCodes[0]).toFormat(cmd.whole);
}
function parseCmdStr(cmdStr) {
    let parts = cmdStr.match(/^(.*?)\{(.*)\}(.*)$/); // TODO: lookbehinds for escape characters
    if (parts) {
        let middle = parseCmdStr(parts[2]);
        return {
            head: parts[1],
            middle,
            tail: parts[3],
            whole: parts[1] + middle.whole + parts[3],
        };
    }
    return {
        head: null,
        middle: null,
        tail: null,
        whole: cmdStr,
    };
}
function formatRange(cmd, formatStart, formatEnd, separator) {
    if (cmd.middle) {
        let startHead = formatStart(cmd.head);
        let startMiddle = formatRange(cmd.middle, formatStart, formatEnd, separator);
        let startTail = formatStart(cmd.tail);
        let endHead = formatEnd(cmd.head);
        let endMiddle = formatRange(cmd.middle, formatStart, formatEnd, separator);
        let endTail = formatEnd(cmd.tail);
        if (startHead === endHead && startTail === endTail) {
            return startHead +
                (startMiddle === endMiddle ? startMiddle : startMiddle + separator + endMiddle) +
                startTail;
        }
    }
    let startWhole = formatStart(cmd.whole);
    let endWhole = formatEnd(cmd.whole);
    if (startWhole === endWhole) {
        return startWhole;
    }
    return startWhole + separator + endWhole;
}

var index = createPlugin({
    name: '@fullcalendar/luxon3',
    cmdFormatter: formatWithCmdStr,
    namedTimeZonedImpl: LuxonNamedTimeZone,
});

export { index as default, toLuxonDateTime, toLuxonDuration };
