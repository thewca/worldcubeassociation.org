import _ from 'lodash';
import { parseActivityCode } from './wcif';
import { DateTime, Duration } from 'luxon';

export function toMicrodegrees(coord) {
  return Math.trunc(parseFloat(coord) * 1e6);
}

export function toDegrees(coord) {
  return coord / 1e6;
}

const currentElementsIds = {
  venue: 0,
  room: 0,
  activity: 0,
};

function withNestedActivities(activities) {
  if (activities.length === 0) return [];
  return [
    ...activities,
    ...withNestedActivities(_.flatMap(activities, 'childActivities')),
  ];
}

export function initElementsIds(venues) {
  // Explore the WCIF to get the highest ids.
  const maxId = (objects) => _.max(_.map(objects, 'id')) || 0;
  const rooms = _.flatMap(venues, 'rooms');
  const activities = _.flatMap(rooms, (room) => withNestedActivities(room.activities));
  currentElementsIds.venue = maxId(venues);
  currentElementsIds.room = maxId(rooms);
  currentElementsIds.activity = maxId(activities);
}

export function newVenueId() {
  currentElementsIds.venue += 1;
  return currentElementsIds.venue;
}

export function newRoomId() {
  currentElementsIds.room += 1;
  return currentElementsIds.room;
}

export function newActivityId() {
  currentElementsIds.activity += 1;
  return currentElementsIds.activity;
}

export function nextActivityId(wcifSchedule) {
  // Explore the WCIF to get the highest ids.
  const maxId = (objects) => _.max(_.map(objects, 'id')) || 0;
  const rooms = wcifSchedule.venues.flatMap((venue) => venue.rooms);
  const activities = rooms.flatMap((room) => withNestedActivities(room.activities));
  return maxId(activities) + 1;
}

export function convertVenueActivitiesToVenueTimezone(oldTZ, venueWcif) {
  // Called when a venue's timezone has been updated, to update all the activities times.
  // The WCA website expose times in UTC, so we need to do two steps:
  //   - first, express each activity times in the old venue's timezone
  //   - second, change the timezone without changing the actual time figure
  //   (eg: 4pm stays 4pm, but in a different timezone).
  const newTZ = venueWcif.timezone;
  venueWcif.rooms.forEach((room) => {
    withNestedActivities(room.activities).forEach((activity) => {
      // Undocumented "keepTime" parameter, see here:
      // https://stackoverflow.com/questions/28593304/same-date-in-different-time-zone/28615654#28615654
      // This enables us to change the UTC offset without changing
      // the *actual* time of the activity!
      // NOTE: we intentionally modify the object referenced by activity.
      /* eslint-disable-next-line */
      activity.startTime = window.moment(activity.startTime).tz(oldTZ).tz(newTZ, true).format();
      /* eslint-disable-next-line */
      activity.endTime = window.moment(activity.endTime).tz(oldTZ).tz(newTZ, true).format();
    });
  });
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
