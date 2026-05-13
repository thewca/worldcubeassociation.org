import { DateTime, Interval } from "luxon";

export function formatDateRange(
  fromDate: string,
  toDate: string,
  options = {},
) {
  return Interval.fromDateTimes(
    DateTime.fromISO(fromDate),
    DateTime.fromISO(toDate),
  ).toLocaleString(
    { month: "short", day: "2-digit", year: "numeric" },
    options,
  );
}
