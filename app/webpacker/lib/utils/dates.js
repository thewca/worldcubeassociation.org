import { DateTime, Interval } from 'luxon';

// parameter name conventions:
// - `luxonDate` for luxon DateTime objects
// - `date` for date-only ISO strings (no time)
// - `dateTime` for date-and-time ISO strings

export const toRelativeOptions = {
  default: {
    locale: window.I18n.locale,
  },
  roundUpAndAtBestDayPrecision: {
    locale: window.I18n.locale,
    // don't be more precise than "days" (i.e. no hours/minutes/seconds)
    unit: ['years', 'months', 'weeks', 'days'],
    // round up, e.g. in 8 hours -> pads to 1 day 8 hours -> rounds to "in 1 day"
    padding: 24 * 60 * 60 * 1000,
  },
};

/// / luxon parameters

export const areOnSameDate = (
  luxonDate1,
  luxonDate2,
  timeZone,
) => luxonDate1
  .setZone(timeZone)
  .hasSame(luxonDate2.setZone(timeZone), 'day');

// eslint-disable-next-line max-len
export const roundBackToHour = (luxonDate) => luxonDate.set({ minute: 0, second: 0, millisecond: 0 });

export const addEndBufferWithinDay = (luxonDate) => {
  const buffered = luxonDate.plus({ minutes: 10 });
  if (buffered.day !== luxonDate.day) {
    return luxonDate;
  }
  return buffered;
};

export const fullTimeDiff = (luxonDate) => {
  const now = DateTime.local();

  const diff = luxonDate.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject();
  return {
    days: Math.floor(diff.days),
    hours: Math.floor(diff.hours),
    minutes: Math.floor(diff.minutes),
    seconds: Math.floor(diff.seconds),
  };
};

/// / string parameters

export function hasPassed(dateTime) {
  return DateTime.fromISO(dateTime) < DateTime.now();
}

export function hasNotPassed(dateTime) {
  return DateTime.now() < DateTime.fromISO(dateTime);
}

export const doesRangeCrossMidnight = (
  startDateTime,
  endDateTime,
  timeZone,
) => {
  const luxonStart = DateTime.fromISO(startDateTime);
  const luxonEnd = DateTime.fromISO(endDateTime);
  return !areOnSameDate(luxonStart, luxonEnd, timeZone);
};

export const getSimpleTimeString = (dateTime, timeZone = 'local') => DateTime.fromISO(dateTime)
  .setZone(timeZone)
  .toLocaleString(DateTime.TIME_SIMPLE);

export const getShortTimeString = (dateTime, timeZone = 'local') => DateTime.fromISO(dateTime)
  .setZone(timeZone)
  .toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET);

export const getShortDateString = (dateTime, timeZone = 'local') => DateTime.fromISO(dateTime)
  .setZone(timeZone)
  .toLocaleString(DateTime.DATE_SHORT);

// note: some uses are passing dates with times or dates without times
// ie: `event_change_deadline_date ?? competitionInfo.start_date`
export const getMediumDateString = (dateTime, timeZone = 'local') => DateTime.fromISO(dateTime)
  .setZone(timeZone)
  .toLocaleString(DateTime.DATE_MED);

export const getLongDateString = (dateTime, timeZone = 'local') => DateTime.fromISO(dateTime)
  .setZone(timeZone)
  .toLocaleString(DateTime.DATE_HUGE);

export const getRegistrationTimestamp = (datetime, timeZone = 'local') => DateTime.fromISO(datetime)
  .setZone(timeZone)
  .toFormat('D TT.u ZZZZ');

export const getFullDateTimeString = (dateTime, timeZone = 'local') => DateTime.fromISO(dateTime)
  .setZone(timeZone)
  .toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);

export const getIsoDateString = (dateTime, timeZone = 'local') => DateTime.fromISO(dateTime)
  .setZone(timeZone)
  .toISODate();

export const getTimeWithSecondsString = (dateTime, timeZone = 'local') => DateTime.fromISO(dateTime)
  .setZone(timeZone)
  .toFormat(DateTime.TIME_WITH_SECONDS);

// start/end dates may have different time-of-days
export const getDatesBetweenInclusive = (
  startDateTime,
  endDateTime,
  timeZone,
) => {
  // avoid infinite loop on invalid params
  if (startDateTime > endDateTime) return [];

  const luxonStart = DateTime.fromISO(startDateTime).setZone(timeZone);
  const luxonEnd = DateTime.fromISO(endDateTime).setZone(timeZone);

  const datesBetween = [];
  let nextDate = luxonStart;
  while (!areOnSameDate(nextDate, luxonEnd, timeZone)) {
    datesBetween.push(nextDate);
    nextDate = nextDate.plus({ days: 1 });
  }
  datesBetween.push(nextDate);
  return datesBetween;
};

// luxon does not support time-only object, so use today's date in utc
export const todayWithTime = (dateTime, timeZone) => {
  const luxonDate = DateTime.fromISO(dateTime).setZone(timeZone);
  return DateTime.utc().set({
    hour: luxonDate.hour,
    minute: luxonDate.minute,
    second: luxonDate.second,
    millisecond: luxonDate.millisecond,
  });
};

export function dateRange(fromDate, toDate, options = {}) {
  return Interval.fromDateTimes(DateTime.fromISO(fromDate), DateTime.fromISO(toDate)).toLocaleString({ month: 'short', day: '2-digit', year: 'numeric' }, options);
}
