import { DateTime } from 'luxon';
import {
  addEndBufferWithinDay,
  areOnSameDate,
  doesRangeCrossMidnight,
  roundBackToHour,
  todayWithTime,
} from './dates';

export const earliestWithLongestTieBreaker = (a, b) => {
  if (a.startTime < b.startTime) {
    return -1;
  }
  if (a.startTime > b.startTime) {
    return 1;
  }
  if (a.endTime < b.endTime) {
    return 1;
  }
  if (a.endTime > b.endTime) {
    return -1;
  }
  return 0;
};

const areGroupable = (a, b) => (
  a.startTime === b.startTime
  && a.endTime === b.endTime
  && a.activityCode === b.activityCode
);

// assumes they are sorted
export const groupActivities = (activities) => {
  const grouped = [];
  activities.forEach((activity) => {
    if (
      grouped.length > 0
      && areGroupable(activity, grouped[grouped.length - 1][0])
    ) {
      grouped[grouped.length - 1].push(activity);
    } else {
      grouped.push([activity]);
    }
  });
  return grouped;
};

export const getActivityEvent = (activity) => activity.activityCode.split('-')[0];

export const getActivityRoundId = (activity) => activity.activityCode.split('-').slice(0, 2).join('-');

export const activitiesOnDate = (
  activities,
  date,
  timeZone,
) => activities.filter(
  (activity) => areOnSameDate(DateTime.fromISO(activity.startTime), date, timeZone),
);

export const earliestTimeOfDayWithBuffer = (
  activities,
  timeZone,
) => {
  if (activities.length === 0) return undefined;

  const doesAnyCrossMidnight = activities.some(
    ({ startTime, endTime }) => doesRangeCrossMidnight(startTime, endTime, timeZone),
  );

  if (doesAnyCrossMidnight) {
    return '00:00:00';
  }

  const startTimes = activities.map(({ startTime }) => todayWithTime(startTime, timeZone));
  return roundBackToHour(DateTime.min(...startTimes)).toISOTime({
    suppressMilliseconds: true,
    includeOffset: false,
  });
};

export const latestTimeOfDayWithBuffer = (
  activities,
  timeZone,
) => {
  if (activities.length === 0) return undefined;

  const doesAnyCrossMidnight = activities.some(
    ({ startTime, endTime }) => doesRangeCrossMidnight(startTime, endTime, timeZone),
  );

  if (doesAnyCrossMidnight) {
    return '24:00:00';
  }

  const endTimes = activities.map(({ endTime }) => todayWithTime(endTime, timeZone));
  const result = addEndBufferWithinDay(DateTime.max(...endTimes)).toISOTime({
    suppressMilliseconds: true,
    includeOffset: false,
  });

  if (result === '00:00:00') {
    return '24:00:00';
  }
  return result;
};
