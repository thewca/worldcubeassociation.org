import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { toLuxonDateTime } from '@fullcalendar/luxon3';
import { parseActivityCode } from './wcif';

export function toMicrodegrees(coord) {
  const result = Math.trunc(parseFloat(coord) * 1e6);
  if (Number.isNaN(result)) {
    return 0;
  }
  return result;
}

export function toDegrees(coord) {
  const result = coord / 1e6;
  if (Number.isNaN(result)) {
    return 0;
  }
  return result;
}

function withNestedActivities(activities) {
  if (activities.length === 0) return [];

  return [
    ...activities,
    ...withNestedActivities(activities.flatMap((activity) => activity.childActivities)),
  ];
}

const maxIdOrZero = (objects) => _.max(objects.map((wcifObj) => wcifObj.id)) || 0;

export function nextVenueId(wcifSchedule) {
  // Explore the WCIF to get the highest ids.
  return maxIdOrZero(wcifSchedule.venues) + 1;
}

export function nextRoomId(wcifSchedule) {
  // Explore the WCIF to get the highest ids.
  const rooms = wcifSchedule.venues.flatMap((venue) => venue.rooms);
  return maxIdOrZero(rooms) + 1;
}

export function nextActivityId(wcifSchedule) {
  // Explore the WCIF to get the highest ids.
  const rooms = wcifSchedule.venues.flatMap((venue) => venue.rooms);
  const activities = rooms.flatMap((room) => withNestedActivities(room.activities));
  return maxIdOrZero(activities) + 1;
}

export function copyActivity(wcifSchedule, activity) {
  const newId = activity.id + nextActivityId(wcifSchedule);
  return {
    ...activity,
    id: newId,
    // the recursive call won't see the new activity id added here, but uniqueness
    // of original activity ids means adding the same constant nextActivityId
    // everywhere won't create duplicates
    childActivities: activity.childActivities.map((act) => copyActivity(wcifSchedule, act)),
  };
}

export function copyRoom(wcifSchedule, room) {
  const newId = room.id + nextRoomId(wcifSchedule);
  return {
    ...room,
    id: newId,
    activities: room.activities.map((activity) => copyActivity(wcifSchedule, activity)),
  };
}

export function copyVenue(wcifSchedule, venue) {
  const newId = venue.id + nextVenueId(wcifSchedule);
  return {
    ...venue,
    id: newId,
    rooms: venue.rooms.map((room) => copyRoom(wcifSchedule, room)),
  };
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

export function rescaleIsoDuration(isoDuration, scalingFactor) {
  const luxonDuration = Duration.fromISO(isoDuration);

  const durationMillis = luxonDuration.toMillis();
  const scaledMillis = durationMillis * scalingFactor;

  return Duration.fromMillis(scaledMillis).rescale().toISO();
}

export function millisecondsBetween(isoStart, isoEnd) {
  const luxonStart = DateTime.fromISO(isoStart);
  const luxonEnd = DateTime.fromISO(isoEnd);

  const diffDuration = luxonEnd.diff(luxonStart);
  return Math.abs(diffDuration.toMillis());
}

export function addIsoDurations(isoDurationA, isoDurationB) {
  const luxonDurationA = Duration.fromISO(isoDurationA);
  const luxonDurationB = Duration.fromISO(isoDurationB);

  const durationSum = luxonDurationA.plus(luxonDurationB);
  return durationSum.rescale().toISO();
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

  const {
    activityId,
    activityCode,
    activityName,
    childActivities,
  } = fcEvent.extendedProps;

  const activity = {
    id: activityId,
    name: activityName,
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
