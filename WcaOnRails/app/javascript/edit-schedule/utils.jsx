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
  venues.forEach(function(venue, index) {
    if (venue.id > currentElementsIds.venue) {
      currentElementsIds.venue = venue.id;
    }
    venue.rooms.forEach(function(room, index) {
      if (room.id > currentElementsIds.room) {
        currentElementsIds.room = room.id;
      }
      let all_ids = room.activities.map(function (elem) { return elem.id; });
      currentElementsIds.activity = Math.max(currentElementsIds.activity, Math.max(...all_ids));
    });
  });
}

export function newVenueId() { return ++currentElementsIds.venue; }
export function newRoomId() { return ++currentElementsIds.room; }
export function newActivityId() { return ++currentElementsIds.activity; }

export function convertVenueActivitiesToVenueTimezone(venueWcif) {
  // Called when a venue's timezone has been updated
  let newTZ = venueWcif.timezone;
  venueWcif.rooms.forEach(function(room) {
    room.activities.forEach(function(activity) {
      // Undocumented "keepTime" parameter (see here: https://stackoverflow.com/questions/28593304/same-date-in-different-time-zone/28615654#28615654)
      // This enables us to change the UTC offset without changing the *actual* time of the activity!
      activity.startTime = moment(activity.startTime).tz(newTZ, true).format();
      activity.endTime = moment(activity.endTime).tz(newTZ, true).format();
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
