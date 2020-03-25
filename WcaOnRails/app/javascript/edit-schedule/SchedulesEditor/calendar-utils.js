import { rootRender } from 'edit-schedule';
import _ from 'lodash';
import {
  roomWcifFromId,
  venueWcifFromRoomId,
} from 'wca/wcif-utils';
import { newActivityId, defaultDurationFromActivityCode } from '../utils';
import { scheduleElementSelector } from './fullcalendar';

const tzConverterHandlers = {
};

const calendarHandlers = {
};

function handleAddActivityToCalendar(reactElem, activityData, renderItOnCalendar) {
  const currentEventSelected = selectedEventInCalendar();
  const roomSelected = roomWcifFromId(reactElem.props.scheduleWcif, reactElem.state.selectedRoom);
  if (roomSelected) {
    const newActivity = {
      id: activityData.id || newActivityId(),
      name: activityData.name,
      activityCode: activityData.activityCode,
      childActivities: [],
    };
    if (activityData.startTime && activityData.endTime) {
      newActivity.startTime = activityData.startTime;
      newActivity.endTime = activityData.endTime;
    } else if (currentEventSelected) {
      const newStart = currentEventSelected.end.clone();
      newActivity.startTime = momentToIso(newStart);
      const newEnd = newStart.add(defaultDurationFromActivityCode(newActivity.activityCode), 'm');
      newActivity.endTime = momentToIso(newEnd);
    } else {
      // Do nothing, user cliked an event without any event selected.
      return;
    }
    roomSelected.activities.push(newActivity);
    if (renderItOnCalendar) {
      const fcEvent = dataToFcEvent(newActivity);
      singleSelectEvent(fcEvent);
      $(scheduleElementSelector).fullCalendar('renderEvent', fcEvent);
    }
    // update list of activityCode used, and rootRender to display the save message
    reactElem.setState({ usedActivityCodeList: [...reactElem.state.usedActivityCodeList, newActivity.activityCode] }, rootRender);
  }
}

function handleEventModifiedInCalendar(reactElem, event) {
  const room = roomWcifFromId(reactElem.props.scheduleWcif, reactElem.state.selectedRoom);
  const activityIndex = _.findIndex(room.activities, { id: event.id });
  if (activityIndex < 0) {
    throw new Error("This is very very BAD, I couldn't find an activity matching the modified event!");
  }
  const currentActivity = room.activities[activityIndex];
  const updatedActivity = fcEventToActivity(event);
  const activityToMoments = ({ startTime, endTime }) => [moment(startTime), moment(endTime)];
  const [currentStart, currentEnd] = activityToMoments(currentActivity);
  const [updatedStart, updatedEnd] = activityToMoments(updatedActivity);
  /* Move and proportionally scale child activities. */
  const lengthRate = updatedEnd.diff(updatedStart) / currentEnd.diff(currentStart);
  updatedActivity.childActivities.forEach((childActivity) => {
    const [childStart, childEnd] = activityToMoments(childActivity);
    const updatedStartDiff = Math.floor(childStart.diff(currentStart) * lengthRate);
    childActivity.startTime = updatedStart.clone().add(updatedStartDiff, 'ms').utc().format();
    const updatedEndDiff = Math.floor(childEnd.diff(currentStart) * lengthRate);
    childActivity.endTime = updatedStart.clone().add(updatedEndDiff, 'ms').utc().format();
  });
  room.activities[activityIndex] = updatedActivity;
  // We rootRender to display the "Please save your changes..." message
  rootRender();
}

function handleRemoveEventFromCalendar(reactElem, event) {
  if (!confirm(`Are you sure you want to remove ${event.title}`)) {
    return false;
  }

  // Remove activityCode from the list used by the ActivityPicker
  const newActivityCodeList = reactElem.state.usedActivityCodeList;
  const activityCodeIndex = newActivityCodeList.indexOf(event.activityCode);
  if (activityCodeIndex < 0) {
    throw new Error("This is BAD, I couldn't find an activity code when removing event!");
  }
  newActivityCodeList.splice(activityCodeIndex, 1);
  const { scheduleWcif } = reactElem.props;
  // Remove activity from the list used by the ActivityPicker
  const room = roomWcifFromId(scheduleWcif, reactElem.state.selectedRoom);
  _.remove(room.activities, { id: event.id });

  // We rootRender to display the "Please save your changes..." message
  reactElem.setState({ usedActivityCodeList: newActivityCodeList }, rootRender());

  $(scheduleElementSelector).fullCalendar('removeEvents', event.id);
  singleSelectLastEvent(scheduleWcif, reactElem.state.selectedRoom);
  return true;
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
  return moment.tz(momentObject.format(), tz).utc().format();
}

export function setupConvertHandlers(editor) {
  tzConverterHandlers.isoStringToAmbiguousMoment = (s) => isoStringToAmbiguousMoment(editor, s);
  tzConverterHandlers.ambiguousMomentToIsoString = (m) => ambiguousMomentToIsoString(editor, m);
}

export function setupCalendarHandlers(editor) {
  calendarHandlers.addActivityToCalendar = _.partial(handleAddActivityToCalendar, editor);
  calendarHandlers.eventModifiedInCalendar = _.partial(handleEventModifiedInCalendar, editor);
  calendarHandlers.removeEventFromCalendar = _.partial(handleRemoveEventFromCalendar, editor);
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

export function isoToMoment(iso) {
  return tzConverterHandlers.isoStringToAmbiguousMoment(iso);
}

export function momentToIso(moment) {
  return tzConverterHandlers.ambiguousMomentToIsoString(moment);
}

// dataToFcEvent is called in two contexts:
//   - as a eventDataTransform callback by fullcalendar
//   - as a way to create an event object from activity data
// In the first case it may contain attributes that are already defined/changed during the event life in FC, and that we must preserve:
//   - start, end, selected, title
// In any case, the data passed will contain activityCode and childActivities, as we propagate them all the time.
// We must make sure the returned object contains at least:
//   - id, title, start, end, activityCode, childActivities
export function dataToFcEvent(data) {
  // Create a FullCalendar event from an activity
  // This copy only defined properties
  const eventData = _.pick(data, ['id', 'title', 'activityCode', 'childActivities', 'start', 'end', 'selected']);

  // Get missing attributes from the activity data

  // Generate a new activity id if needed
  if (!eventData.hasOwnProperty('id')) {
    eventData.id = newActivityId();
  }

  if (!eventData.hasOwnProperty('title')) {
    eventData.title = data.name;
  }

  // While in FC, any time is ambiguously-zoned
  // We'll add back the room's venue's timezone when exporting the WCIF
  if (!eventData.hasOwnProperty('start')) {
    eventData.start = isoToMoment(data.startTime);
  }

  if (!eventData.hasOwnProperty('end')) {
    eventData.end = isoToMoment(data.endTime);
  }

  return eventData;
}

export function fcEventToActivity(event) {
  // Build a cleaned up activity from a FullCalendar event
  const activity = {
    id: event.id,
    name: event.title,
    activityCode: event.activityCode,
  };
  if (event.hasOwnProperty('start')) {
    activity.startTime = momentToIso(event.start);
  }
  if (event.hasOwnProperty('end')) {
    activity.endTime = momentToIso(event.end);
  }
  if (event.hasOwnProperty('childActivities')) {
    // Not modified by FC, put them back anyway
    activity.childActivities = event.childActivities;
  } else {
    activity.childActivities = [];
  }
  return activity;
}

export function selectedEventInCalendar() {
  const matching = $(scheduleElementSelector).fullCalendar('clientEvents', (event) => event.selected);
  return matching.length > 0 ? matching[0] : null;
}

// DO NOT call this when resizing/dragging!!!
// When resizing/dragging, FC add the event to a 'fc-helper-container', which
// has the css to be displayed as the selected event.
// Instead you'd rather want to:
//   - visually remove any selected event when resizing/dragging starts (see onDragStart@fullcalendar.js)
//   - actually update FC's internal states when resizing/dragging is over, as
//   it is safe to call this function then.
export function singleSelectEvent(event) {
  // return if the event has been already selected
  if (event.selected) {
    return;
  }
  const events = $(scheduleElementSelector).fullCalendar('clientEvents');
  events.forEach((elem) => {
    if (elem.selected && (event.id != elem.id)) {
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
