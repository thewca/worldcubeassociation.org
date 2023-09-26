import _ from 'lodash';
import {
  roomWcifFromId,
  venueWcifFromRoomId,
} from './wcif';
import { newActivityId } from './edit-schedule';
import { scheduleElementSelector } from '../helpers/edit-schedule';

const tzConverterHandlers = {
};

export const calendarHandlers = {
};

export function isoToMoment(iso) {
  return tzConverterHandlers.isoStringToAmbiguousMoment(iso);
}

export function momentToIso(moment) {
  return tzConverterHandlers.ambiguousMomentToIsoString(moment);
}

export function selectedEventInCalendar() {
  const matching = $(scheduleElementSelector).fullCalendar('clientEvents', (event) => event.selected);
  return matching.length > 0 ? matching[0] : null;
}

// dataToFcEvent is called in two contexts:
//   - as a eventDataTransform callback by fullcalendar
//   - as a way to create an event object from activity data
// In the first case it may contain attributes that are already defined/changed
// during the event life in FC, and that we must preserve:
//   - start, end, selected, title
// In any case, the data passed will contain activityCode and childActivities,
// as we propagate them all the time.
// We must make sure the returned object contains at least:
//   - id, title, start, end, activityCode, childActivities
export function dataToFcEvent(data) {
  // Create a FullCalendar event from an activity
  // This copy only defined properties
  const eventData = _.pick(data, ['id', 'title', 'activityCode', 'childActivities', 'start', 'end', 'selected']);

  // Get missing attributes from the activity data

  // Generate a new activity id if needed
  if (!Object.prototype.hasOwnProperty.call(eventData, 'id')) {
    eventData.id = newActivityId();
  }

  if (!Object.prototype.hasOwnProperty.call(eventData, 'title')) {
    eventData.title = data.name;
  }

  // While in FC, any time is ambiguously-zoned
  // We'll add back the room's venue's timezone when exporting the WCIF
  if (!Object.prototype.hasOwnProperty.call(eventData, 'start')) {
    eventData.start = isoToMoment(data.startTime);
  }

  if (!Object.prototype.hasOwnProperty.call(eventData, 'end')) {
    eventData.end = isoToMoment(data.endTime);
  }

  return eventData;
}

// DO NOT call this when resizing/dragging!!!
// When resizing/dragging, FC add the event to a 'fc-helper-container', which
// has the css to be displayed as the selected event.
// Instead you'd rather want to:
//   - visually remove any selected event when resizing/dragging starts
//   (see onDragStart@fullcalendar.js)
//   - actually update FC's internal states when resizing/dragging is over, as
//   it is safe to call this function then.
export function singleSelectEvent(ev) {
  const event = ev;
  // return if the event has been already selected
  if (event.selected) {
    return;
  }
  const events = $(scheduleElementSelector).fullCalendar('clientEvents');
  events.forEach((el) => {
    const elem = el;
    if (elem.selected && (event.id !== elem.id)) {
      elem.selected = false;
      $(scheduleElementSelector).fullCalendar('updateEvent', elem);
    }
  });
  event.selected = true;
  $(scheduleElementSelector).fullCalendar('updateEvent', event);
}

export function singleSelectLastEvent(scheduleWcif, selectedRoom) {
  const room = roomWcifFromId(scheduleWcif, selectedRoom);
  if (room) {
    if (room.activities.length > 0) {
      const lastActivity = _.last(room.activities);
      const fcEvent = $(scheduleElementSelector).fullCalendar('clientEvents', lastActivity.id)[0];
      singleSelectEvent(fcEvent);
    }
  }
}

export function fcEventToActivity(event) {
  // Build a cleaned up activity from a FullCalendar event
  const activity = {
    id: event.id,
    name: event.title,
    activityCode: event.activityCode,
  };
  if (Object.prototype.hasOwnProperty.call(event, 'start')) {
    activity.startTime = momentToIso(event.start);
  }
  if (Object.prototype.hasOwnProperty.call(event, 'end')) {
    activity.endTime = momentToIso(event.end);
  }
  if (Object.prototype.hasOwnProperty.call(event, 'childActivities')) {
    // Not modified by FC, put them back anyway
    activity.childActivities = event.childActivities;
  } else {
    activity.childActivities = [];
  }
  return activity;
}
function isoStringToAmbiguousMoment(editor, isoString) {
  const venue = venueWcifFromRoomId(editor.props.scheduleWcif, editor.state.selectedRoom);
  const tz = venue.timezone;
  // Using FC's moment because it has a custom "stripZone" feature
  // The final FC display will be timezone-free, and the user expect a calendar
  // in the venue's TZ.
  // First convert the time received into the venue's timezone, then strip its value
  return $.fullCalendar.moment(isoString).tz(tz).stripZone();
}

function ambiguousMomentToIsoString(editor, momentObject) {
  const venue = venueWcifFromRoomId(editor.props.scheduleWcif, editor.state.selectedRoom);
  const tz = venue.timezone;
  // Take the moment and "concatenate" the UTC offset of the timezone at that time
  // momentObject is a FC (ambiguously zoned) moment, therefore format() returns a zone free string
  return window.moment.tz(momentObject.format(), tz).utc().format();
}

export function setupConvertHandlers(editor) {
  tzConverterHandlers.isoStringToAmbiguousMoment = (s) => isoStringToAmbiguousMoment(editor, s);
  tzConverterHandlers.ambiguousMomentToIsoString = (m) => ambiguousMomentToIsoString(editor, m);
}

export function addActivityToCalendar(data, renderItOnCalendar = true) {
  return calendarHandlers.addActivityToCalendar(data, renderItOnCalendar);
}

export function eventModifiedInCalendar(event) {
  return calendarHandlers.eventModifiedInCalendar(event);
}

export function removeEventFromCalendar(event) {
  return calendarHandlers.removeEventFromCalendar(event);
}

const HEX_BASE = 16;
const HEX_CHANNEL_REGEX = /^#(?<r>[0-9A-Fa-f]{2})(?<g>[0-9A-Fa-f]{2})(?<b>[0-9A-Fa-f]{2})$/;

/**
 * Convert a HEX color code to RGB values.
 *
 * @example
 * // returns [255, 255, 255]
 * getTextColor('#ffffff');
 *
 * @param {string} hexColor HEX color code to convert to RGB
 *
 * @returns {Array<number>} RBG values, defaults to `[0, 0, 0]` if `hexColor` cannot be parsed
 */
export const hexToRgb = (hexColor) => {
  const match = hexColor.match(HEX_CHANNEL_REGEX);

  if (match !== null) {
    return [
      parseInt(match.groups.r, HEX_BASE),
      parseInt(match.groups.g, HEX_BASE),
      parseInt(match.groups.b, HEX_BASE),
    ];
  }

  return [0, 0, 0];
};

const WHITE = '#ffffff';
const BLACK = '#000000';

/**
 * Compute appropriate text color (black or white) based on how "light" or "dark"
 * the background color of a calendar item is.
 *
 * @example
 * // returns #000000 (black given white background color)
 * getTextColor('#ffffff');
 *
 * @param {string} backgroundColor Calendar item's background color (in HEX)
 *
 * @returns {string} white for "dark" backgrounds, black for "light" backgrounds
 */
export const getTextColor = (backgroundColor) => {
  const [red, green, blue] = hexToRgb(backgroundColor);
  // formula from https://stackoverflow.com/a/3943023
  return (red * 0.299 + green * 0.587 + blue * 0.114) > 186 ? BLACK : WHITE;
};
