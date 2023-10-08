import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { toLuxonDateTime } from '@fullcalendar/luxon3';
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
    ...withNestedActivities(activities.flatMap((activity) => activity.childActivities)),
  ];
}

const maxId = (objects) => _.max(objects.map((wcifObj) => wcifObj.id)) || 0;

export function nextVenueId(wcifSchedule) {
  // Explore the WCIF to get the highest ids.
  return maxId(wcifSchedule.venues) + 1;
}

export function nextRoomId(wcifSchedule) {
  // Explore the WCIF to get the highest ids.
  const rooms = wcifSchedule.venues.flatMap((venue) => venue.rooms);
  return maxId(rooms) + 1;
}

export function nextActivityId(wcifSchedule) {
  // Explore the WCIF to get the highest ids.
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

export function luxonToWcifIso(luxonDateTime) {
  return luxonDateTime.toUTC().toISO({ suppressMilliseconds: true });
}

export function moveByIsoDuration(isoDateTime, isoDuration) {
  const luxonDuration = Duration.fromISO(isoDuration);
  const luxonDateTime = DateTime.fromISO(isoDateTime);

  const movedDateTime = luxonDateTime.plus(luxonDuration);

  return luxonToWcifIso(movedDateTime);
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

  return luxonToWcifIso(newZoneSameLocalTime);
}

export function fcEventToActivityAndDates(fcEvent, calendar) {
  const eventStartLuxon = toLuxonDateTime(fcEvent.start, calendar);
  const eventEndLuxon = toLuxonDateTime(fcEvent.end, calendar);

  const utcStartIso = luxonToWcifIso(eventStartLuxon);
  const utcEndIso = luxonToWcifIso(eventEndLuxon);

  const { activityCode, childActivities } = fcEvent.extendedProps;

  const activity = {
    name: fcEvent.title,
    activityCode,
    startTime: utcStartIso,
    endTime: utcEndIso,
    childActivities: childActivities || [],
  };

  return {
    activity,
    startLuxon: eventStartLuxon,
    endLuxon: eventEndLuxon,
  };
}
