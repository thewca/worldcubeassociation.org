import { DateTime } from 'luxon';

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
