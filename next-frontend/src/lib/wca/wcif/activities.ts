import { DateTime, Duration, Zone } from "luxon";
import {
  addEndBufferWithinDay,
  areOnSameDate,
  doesRangeCrossMidnight,
  roundBackToHour,
  todayWithTime,
} from "../dates";
import { localizeActivityCode, WcifEvent, WcifRound } from "./rounds";

import type { components } from "@/types/openapi";
import { TFunction } from "i18next";

export type WcifSchedule = components["schemas"]["WcifSchedule"];
export type WcifActivity = components["schemas"]["WcifActivity"];
export type WcifVenue = components["schemas"]["WcifVenue"];
export type WcifRoom = components["schemas"]["WcifRoom"];

export const earliestWithLongestTieBreaker = (
  a: WcifActivity,
  b: WcifActivity,
) => {
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

const areGroupable = (a: WcifActivity, b: WcifActivity) =>
  a.startTime === b.startTime &&
  a.endTime === b.endTime &&
  a.activityCode === b.activityCode;

// assumes they are sorted
export const groupActivities = (activities: WcifActivity[]) => {
  const grouped: WcifActivity[][] = [];
  activities.forEach((activity) => {
    if (
      grouped.length > 0 &&
      areGroupable(activity, grouped[grouped.length - 1][0])
    ) {
      grouped[grouped.length - 1].push(activity);
    } else {
      grouped.push([activity]);
    }
  });
  return grouped;
};

export const getActivityEventId = (activity: WcifActivity) =>
  activity.activityCode.split("-")[0];

export const getActivityRoundId = (activity: WcifActivity) =>
  activity.activityCode.split("-").slice(0, 2).join("-");

export const findActivityEvent = (
  activity: WcifActivity,
  wcifEvents: WcifEvent[],
) => {
  const eventId = getActivityEventId(activity);
  return wcifEvents.find((event) => event.id === eventId);
};

export const findActivityRound = (
  activity: WcifActivity,
  wcifRounds: WcifRound[],
) => {
  const roundId = getActivityRoundId(activity);
  return wcifRounds.find((round) => round.id === roundId);
};

export const activitiesOnDate = (
  activities: WcifActivity[],
  date: DateTime,
  timeZone: string | Zone,
) =>
  activities.filter((activity) =>
    areOnSameDate(DateTime.fromISO(activity.startTime), date, timeZone),
  );

export const earliestTimeOfDayWithBuffer = (
  activities: WcifActivity[],
  timeZone: string | Zone,
) => {
  if (activities.length === 0) return undefined;

  const doesAnyCrossMidnight = activities.some(({ startTime, endTime }) =>
    doesRangeCrossMidnight(startTime, endTime, timeZone),
  );

  if (doesAnyCrossMidnight) {
    return "00:00:00";
  }

  const startTimes = activities.map(({ startTime }) =>
    todayWithTime(startTime, timeZone),
  );

  return roundBackToHour(DateTime.min(...startTimes)).toISOTime({
    suppressMilliseconds: true,
    includeOffset: false,
  });
};

export const latestTimeOfDayWithBuffer = (
  activities: WcifActivity[],
  timeZone: string | Zone,
) => {
  if (activities.length === 0) return undefined;

  const doesAnyCrossMidnight = activities.some(({ startTime, endTime }) =>
    doesRangeCrossMidnight(startTime, endTime, timeZone),
  );

  if (doesAnyCrossMidnight) {
    return "24:00:00";
  }

  const endTimes = activities.map(({ endTime }) =>
    todayWithTime(endTime, timeZone),
  );

  const result = addEndBufferWithinDay(DateTime.max(...endTimes)).toISOTime({
    suppressMilliseconds: true,
    includeOffset: false,
  });

  if (result === "00:00:00") {
    return "24:00:00";
  }

  return result;
};

/** e.g. '15:00:00' -> 15 */
export const getHour = (
  timeString: string,
  options: { roundForward?: boolean } = { roundForward: false },
) => {
  if (timeString) {
    const { hours, minutes } = Duration.fromISOTime(timeString).toObject();

    if (options.roundForward && minutes !== 0) {
      return hours! + 1;
    }

    return hours;
  }

  return undefined;
};

export const localizeActivityName = (
  t: TFunction,
  activity: WcifActivity,
  wcifEvents: WcifEvent[],
) => {
  const activityEvent = findActivityEvent(activity, wcifEvents)!;
  const activityRound = findActivityRound(activity, activityEvent.rounds)!;

  return localizeActivityCode(
    t,
    activity.activityCode,
    activityRound,
    activityEvent,
  );
};

export const isOrphanedActivity = (
  activity: WcifActivity,
  wcifEvents: WcifEvent[],
) => {
  if (getActivityEventId(activity) === "other") {
    // 'other' activities are never matched to an event because by definition,
    //   they are not a standard WCA event.
    return false;
  }

  const activityEvent = findActivityEvent(activity, wcifEvents);

  return (
    activityEvent === undefined ||
    findActivityRound(activity, activityEvent.rounds) === undefined
  );
};

export function toMicrodegrees(coord: string) {
  const result = Math.trunc(parseFloat(coord) * 1e6);

  if (Number.isNaN(result)) {
    return 0;
  }

  return result;
}

export function toDegrees(coord: number) {
  const result = coord / 1e6;

  if (Number.isNaN(result)) {
    return 0;
  }

  return result;
}
