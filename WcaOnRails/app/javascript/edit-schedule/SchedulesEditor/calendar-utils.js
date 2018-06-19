import { rootRender } from 'edit-schedule'
import { newActivityId, defaultDurationFromActivityCode } from '../utils'
import {
  activityIndexInArray,
  roomWcifFromId,
  venueWcifFromRoomId,
} from 'wca/wcif-utils'
import { scheduleElementSelector } from './fullcalendar'

const tzConverterHandlers = {
};

const calendarHandlers = {
};

function handleAddActivityToCalendar(reactElem, activityData, renderItOnCalendar) {
  let currentEventSelected = selectedEventInCalendar();
  let roomSelected = roomWcifFromId(reactElem.props.scheduleWcif, reactElem.state.selectedRoom);
  if (roomSelected) {
    let newActivity = {
      id: activityData.id || newActivityId(),
      name: activityData.name,
      activityCode: activityData.activityCode,
      childActivities: [],
    };
    if (activityData.startTime && activityData.endTime) {
      newActivity.startTime = activityData.startTime;
      newActivity.endTime = activityData.endTime;
    } else if (currentEventSelected) {
      let newStart = currentEventSelected.end.clone();
      newActivity.startTime = momentToIso(newStart);
      let newEnd = newStart.add(defaultDurationFromActivityCode(newActivity.activityCode), "m");
      newActivity.endTime = momentToIso(newEnd);
    } else {
      // Do nothing, user cliked an event without any event selected.
      return;
    }
    roomSelected.activities.push(newActivity);
    if (renderItOnCalendar) {
      // Cloning the object here: activityToFcEvent modifies in place,
      // and we don't want event.selected to propagate in the WCIF!
      let fcEvent = Object.assign({}, newActivity);
      fcEvent = activityToFcEvent(fcEvent);
      singleSelectEvent(fcEvent);
      $(scheduleElementSelector).fullCalendar("renderEvent", fcEvent);
    }
    // update list of activityCode used, and rootRender to display the save message
    reactElem.setState({ usedActivityCodeList: [...reactElem.state.usedActivityCodeList, newActivity.activityCode] }, rootRender());
  }
}

function handleEventModifiedInCalendar(reactElem, event) {
  let room = roomWcifFromId(reactElem.props.scheduleWcif, reactElem.state.selectedRoom);
  let activityIndex = activityIndexInArray(room.activities, event.id);
  if (activityIndex < 0) {
    throw new Error("This is very very BAD, I couldn't find an activity matching the modified event!");
  }
  let activity = room.activities[activityIndex];
  activity.name = event.name;
  activity.activityCode = event.activityCode;
  activity.startTime = momentToIso(event.start);
  activity.endTime = momentToIso(event.end);
  // We rootRender to display the "Please save your changes..." message
  rootRender();
}

function handleRemoveEventFromCalendar(reactElem, event) {
  if (!confirm(`Are you sure you want to remove ${event.name}`)) {
    return false;
  }

  // Remove activityCode from the list used by the ActivityPicker
  let newActivityCodeList = reactElem.state.usedActivityCodeList;
  let activityCodeIndex = newActivityCodeList.indexOf(event.activityCode);
  if (activityCodeIndex < 0) {
    throw new Error("This is BAD, I couldn't find an activity code when removing event!");
  }
  newActivityCodeList.splice(activityCodeIndex, 1);
  let scheduleWcif = reactElem.props.scheduleWcif;
  // Remove activity from the list used by the ActivityPicker
  let room = roomWcifFromId(scheduleWcif, reactElem.state.selectedRoom);
  let activityIndex = activityIndexInArray(room.activities, event.id);
  if (activityIndex < 0) {
    throw new Error("This is very very BAD, I couldn't find an activity matching the removed event!");
  }
  room.activities.splice(activityIndex, 1);
  // We rootRender to display the "Please save your changes..." message
  reactElem.setState({ usedActivityCodeList: newActivityCodeList }, rootRender());

  $(scheduleElementSelector).fullCalendar('removeEvents', event.id);
  singleSelectLastEvent(scheduleWcif, reactElem.state.selectedRoom);
  return true;
}

function isoStringToAmbiguousMoment(editor, isoString) {
  let venue = venueWcifFromRoomId(editor.props.scheduleWcif, editor.state.selectedRoom);
  let tz = venue.timezone;
  // Using FC's moment because it has a custom "stripZone" feature
  // The final FC display will be timezone-free, and the user expect a calendar
  // in the venue's TZ.
  // First convert the time received into the venue's timezone, then strip its value
  let ret = $.fullCalendar.moment(isoString).tz(tz).stripZone();
  return ret;
}

function ambiguousMomentToIsoString(editor, momentObject) {
  let venue = venueWcifFromRoomId(editor.props.scheduleWcif, editor.state.selectedRoom);
  let tz = venue.timezone;
  // Take the moment and "concatenate" the UTC offset of the timezone at that time
  // momentObject is a FC (ambiguously zoned) moment, therefore format() returns a zone free string
  let ret = moment.tz(momentObject.format(), tz).format();
  return ret;
}

export function setupConvertHandlers(editor) {
  tzConverterHandlers.isoStringToAmbiguousMoment = s => isoStringToAmbiguousMoment(editor, s);
  tzConverterHandlers.ambiguousMomentToIsoString = m => ambiguousMomentToIsoString(editor, m);
}

export function setupCalendarHandlers(editor) {
  calendarHandlers.addActivityToCalendar = (data, renderItOnCalendar) => handleAddActivityToCalendar(editor, data, renderItOnCalendar);
  calendarHandlers.eventModifiedInCalendar = (event) => handleEventModifiedInCalendar(editor, event);
  calendarHandlers.removeEventFromCalendar = (event) => handleRemoveEventFromCalendar(editor, event);
}

export function addActivityToCalendar(data, renderItOnCalendar=true) {
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

export function activityToFcEvent(eventData) {
  // Create a FullCalendar event from an activity
  if (eventData.hasOwnProperty("name")) {
    eventData.title = eventData.name;
  }
  // Generate a new activity id if needed
  if (!eventData.hasOwnProperty("id")) {
    eventData.id = newActivityId();
  }

  // Keep activityCode untouched
  // Keep childActivities untouched

  // While in FC, any time is ambiguously-zoned
  // We'll add back the room's venue's timezone when exporting the WCIF
  if (eventData.hasOwnProperty("startTime")) {
    eventData.start = isoToMoment(eventData.startTime);
  }
  if (eventData.hasOwnProperty("endTime")) {
    eventData.end = isoToMoment(eventData.endTime);
  }
  return eventData;
}

export function fcEventToActivity(event) {
  // Build a cleaned up activity from a FullCalendar event
  let activity = {
    id: event.id,
    name: event.title,
    activityCode: event.activityCode,
  };
  if (event.hasOwnProperty("start")) {
    activity.startTime = momentToIso(event.start);
  }
  if (event.hasOwnProperty("end")) {
    activity.endTime = momentToIso(event.end);
  }
  if (event.hasOwnProperty("childActivities")) {
    // Not modified by FC, put them back anyway
    activity.childActivities = event.childActivities;
  } else {
    activity.childActivities = [];
  }
  return activity;
}

export function selectedEventInCalendar() {
  let matching = $(scheduleElementSelector).fullCalendar("clientEvents", function(event) {
    return event.selected;
  });
  return matching.length > 0 ? matching[0] : null;
}

export function singleSelectEvent(event) {
  // return if the event has been already selected
  if (event.selected) {
    return false;
  }
  let events = $(scheduleElementSelector).fullCalendar("clientEvents");
  events.forEach(function(elem) {
    if (elem.selected && (event.id != elem.id)) {
      elem.selected = false;
      // this function might be called while dragging/resizing,
      // so we'd better remove the class ourselves instead of calling updateEvent!
      $(".selected-fc-event").removeClass("selected-fc-event");
    }
  });
  event.selected = true;
  // We don't render again the element: on dragging/resizing it will be rerendered, else the caller will take care of the update.
  return true;
}

export function singleSelectLastEvent(scheduleWcif, selectedRoom) {
  let room = roomWcifFromId(scheduleWcif, selectedRoom);
  if (room) {
    if (room.activities.length > 0) {
      let lastActivity = room.activities[room.activities.length - 1];
      let fcEvent = $(scheduleElementSelector).fullCalendar("clientEvents", lastActivity.id)[0];
      if (singleSelectEvent(fcEvent)) {
        $(scheduleElementSelector).fullCalendar("updateEvent", fcEvent);
      }
    }
  }
}

