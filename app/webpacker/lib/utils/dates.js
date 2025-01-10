import { DateTime } from 'luxon';
import I18n from '../i18n';
// parameter name conventions:
// - `luxonDate` for luxon DateTime objects
// - `date` for date-only ISO strings (no time)
// - `dateTime` for date-and-time ISO strings

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

function getMonthNames(format = 'short') {
  const formatter = new Intl.DateTimeFormat(window.I18n.locale, {
    month: format === 'short' ? 'short' : 'long',
  });

  return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2000, i)));
}

// Translated from https://github.com/mbillard/time_will_tell/blob/master/lib/time_will_tell/helpers/date_range_helper.rb
export function dateRange(fromDate, toDate, options = {}) {
  const format = options.format || 'short';
  const scope = options.scope || 'time_will_tell.date_range';
  const separator = options.separator || '—';
  const showYear = options.showYear !== false;

  const monthNames = getMonthNames(format);

  let fromDateTime = DateTime.fromISO(fromDate);
  let toDateTime = DateTime.fromISO(toDate);

  if (fromDateTime > toDateTime) {
    [fromDateTime, toDateTime] = [toDateTime, fromDateTime];
  }

  const fromDay = fromDateTime.day;
  const fromMonth = monthNames[fromDateTime.month - 1];
  const fromYear = fromDateTime.year;
  const toDay = toDateTime.day;

  const dates = { from_day: fromDay, sep: separator };
  let template;

  if (fromDateTime.hasSame(toDateTime, 'day')) {
    template = 'same_date';
    Object.assign(dates, { month: fromMonth, year: fromYear });
  } else if (fromDateTime.hasSame(toDateTime, 'month') && fromDateTime.hasSame(toDateTime, 'year')) {
    template = 'same_month';
    Object.assign(dates, { to_day: toDay, month: fromMonth, year: fromYear });
  } else {
    const toMonth = monthNames[toDateTime.month - 1];

    Object.assign(dates, {
      from_month: fromMonth,
      to_month: toMonth,
      to_day: toDay,
    });

    if (fromDateTime.hasSame(toDateTime, 'year')) {
      template = 'different_months_same_year';
      dates.year = fromYear;
    } else {
      const toYear = toDateTime.year;
      template = 'different_years';
      Object.assign(dates, { from_year: fromYear, to_year: toYear });
    }
  }

  const withoutYear = I18n.t(`${scope}.${template}`, dates);

  if (showYear && fromDateTime.hasSame(toDateTime, 'year')) {
    return (
      I18n.t(`${scope}.with_year`, {
        date_range: withoutYear,
        year: fromYear,
        defaultValue: withoutYear,
      }) || withoutYear
    );
  }
  return withoutYear;
}
