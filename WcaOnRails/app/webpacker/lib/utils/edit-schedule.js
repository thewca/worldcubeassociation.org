import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { parseActivityCode } from './wcif';

export function toMicrodegrees(coord) {
  return Math.trunc(parseFloat(coord) * 1e6);
}

export function toDegrees(coord) {
  return coord / 1e6;
}

function withNestedActivities(activities) {
  if (activities.length === 0) return [];
  return [
    ...activities,
    ...withNestedActivities(_.flatMap(activities, 'childActivities')),
  ];
}

export function nextActivityId(wcifSchedule) {
  // Explore the WCIF to get the highest ids.
  const maxId = (objects) => _.max(_.map(objects, 'id')) || 0;
  const rooms = wcifSchedule.venues.flatMap((venue) => venue.rooms);
  const activities = rooms.flatMap((room) => withNestedActivities(room.activities));
  return maxId(activities) + 1;
}

export function defaultDurationFromActivityCode(activityCode) {
  const { eventId } = parseActivityCode(activityCode);
  if (eventId === '333fm' || eventId === '333mbf'
      || activityCode === 'other-lunch' || activityCode === 'other-awards') {
    return 60;
  }
  return 30;
}

export function moveByIsoDuration(isoDateTime, isoDuration) {
  const luxonDuration = Duration.fromISO(isoDuration);
  const luxonDateTime = DateTime.fromISO(isoDateTime);

  const movedDateTime = luxonDateTime.plus(luxonDuration);

  return movedDateTime.toISO({ suppressMilliseconds: true });
}

export function rescaleDuration(isoDuration, scalingFactor) {
  const luxonDuration = Duration.fromISO(isoDuration);

  const durationMillis = luxonDuration.toMillis();
  const scaledMillis = durationMillis * scalingFactor;

  return Duration.fromMillis(scaledMillis).rescale().toISO();
}

export function changeTimezoneKeepingLocalTime(isoDateTime, oldTimezone, newTimezone) {
  const luxonDateTime = DateTime.fromISO(isoDateTime);

  const oldLocalDateTime = luxonDateTime.setZone(oldTimezone);
  const newZoneSameLocalTime = oldLocalDateTime.setZone(newTimezone, { keepLocalTime: true });

  return newZoneSameLocalTime.toISO({ suppressMilliseconds: true });
}
