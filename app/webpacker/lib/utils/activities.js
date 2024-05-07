import { DateTime } from 'luxon';
import {
  addEndBufferWithinDay,
  areOnSameDate,
  doesRangeCrossMidnight,
  roundBackToHour,
  todayWithTime,
} from './dates';
import I18n from '../i18n';
import { getRoundTypeId, parseActivityCode } from './wcif';

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

export const getActivityEventId = (activity) => activity.activityCode.split('-')[0];

export const getActivityRoundId = (activity) => activity.activityCode.split('-').slice(0, 2).join('-');

export const findActivityEvent = (activity, wcifEvents) => {
  const eventId = getActivityEventId(activity);
  return wcifEvents.find((event) => event.id === eventId);
};

export const findActivityRound = (activity, wcifRounds) => {
  const roundId = getActivityRoundId(activity);
  return wcifRounds.find((round) => round.id === roundId);
};

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

export const localizeActivityName = (activity, wcifEvents) => {
  const { eventId, roundNumber, attempt } = parseActivityCode(activity.activityCode);

  const activityEvent = findActivityEvent(activity, wcifEvents);
  const activityRound = findActivityRound(activity, activityEvent.rounds);

  const roundTypeId = getRoundTypeId(
    roundNumber,
    activityEvent.rounds.length,
    Boolean(activityRound.cutoff),
  );

  const eventName = I18n.t(`events.${eventId}`);
  const roundTypeName = I18n.t(`rounds.${roundTypeId}.name`);

  const roundName = I18n.t('round.name', { event_name: eventName, round_name: roundTypeName });

  if (attempt) {
    const attemptName = I18n.t('attempts.attempt_name', { number: attempt });
    return `${roundName} (${attemptName})`;
  }

  return roundName;
};
