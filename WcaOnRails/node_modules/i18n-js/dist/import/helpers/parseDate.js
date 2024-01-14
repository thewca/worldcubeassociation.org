export function parseDate(input) {
    if (input instanceof Date) {
        return input;
    }
    if (typeof input === "number") {
        const date = new Date();
        date.setTime(input);
        return date;
    }
    const matches = new String(input).match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2})(?:[.,](\d{1,3}))?)?(Z|\+00:?00)?/);
    if (matches) {
        const parts = matches.slice(1, 8).map((match) => parseInt(match, 10) || 0);
        parts[1] -= 1;
        const [year, month, day, hour, minute, second, milliseconds] = parts;
        const timezone = matches[8];
        if (timezone) {
            return new Date(Date.UTC(year, month, day, hour, minute, second, milliseconds));
        }
        else {
            return new Date(year, month, day, hour, minute, second, milliseconds);
        }
    }
    if (input.match(/([A-Z][a-z]{2}) ([A-Z][a-z]{2}) (\d+) (\d+:\d+:\d+) ([+-]\d+) (\d+)/)) {
        const date = new Date();
        date.setTime(Date.parse([RegExp.$1, RegExp.$2, RegExp.$3, RegExp.$6, RegExp.$4, RegExp.$5].join(" ")));
    }
    const date = new Date();
    date.setTime(Date.parse(input));
    return date;
}
//# sourceMappingURL=parseDate.js.map