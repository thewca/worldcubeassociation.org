import { parseActivityCode } from 'wca/wcif-utils'

export function toMicrodegrees(coord) {
  return Math.trunc(parseFloat(coord)*1e6);
}

export function toDegrees(coord) {
  return coord/1e6;
}

const currentElementsIds = {
  venue: 0,
  room: 0,
  activity: 0,
};

export function initElementsIds(venues) {
  // Explore the WCIF to get the highest ids.
  const maxId = objects => _.max(_.map(objects, 'id')) || 0;
  const rooms = _.flatMap(venues, 'rooms');
  const activities = _.flatMap(rooms, 'activities');
  currentElementsIds.venue = maxId(venues);
  currentElementsIds.room = maxId(rooms);
  currentElementsIds.activity = maxId(activities);
}

export function newVenueId() { return ++currentElementsIds.venue; }
export function newRoomId() { return ++currentElementsIds.room; }
export function newActivityId() { return ++currentElementsIds.activity; }

export function convertVenueActivitiesToVenueTimezone(oldTZ, venueWcif) {
  // Called when a venue's timezone has been updated, to update all the activities times.
  // The WCA website expose times in UTC, so we need to do two steps:
  //   - first, express each activity times in the old venue's timezone
  //   - second, change the timezone without changing the actual time figure (eg: 4pm stays 4pm, but in a different timezone).
  let newTZ = venueWcif.timezone;
  venueWcif.rooms.forEach(room => {
    room.activities.forEach(activity => {
      // Undocumented "keepTime" parameter (see here: https://stackoverflow.com/questions/28593304/same-date-in-different-time-zone/28615654#28615654)
      // This enables us to change the UTC offset without changing the *actual* time of the activity!
      activity.startTime = moment(activity.startTime).tz(oldTZ).tz(newTZ, true).format();
      activity.endTime = moment(activity.endTime).tz(oldTZ).tz(newTZ, true).format();
    });
  });
}


export function defaultDurationFromActivityCode(activityCode) {
  let { eventId } = parseActivityCode(activityCode);
  if (eventId == "333fm" || eventId == "333mbf"
      || activityCode == "other-lunch" || activityCode == "other-awards") {
    return 60;
  } else {
    return 30;
  }
}
