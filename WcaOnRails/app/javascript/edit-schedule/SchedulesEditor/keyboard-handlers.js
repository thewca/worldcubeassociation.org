import _ from 'lodash'
import {
  addActivityToCalendar,
  eventModifiedInCalendar,
  removeEventFromCalendar,
  selectedEventInCalendar,
  singleSelectEvent,
} from './calendar-utils'
import { scheduleElementSelector } from './fullcalendar'
import { schedulesEditPanelSelector } from '../EditSchedule'

export const keyboardHandlers = [];


export function editScheduleKeyboardHandler(event, activityPicker) {
  let startDate = $.fullCalendar.moment(activityPicker.props.scheduleWcif.startDate);
  let firstDayAfterCompetition = startDate.clone();
  firstDayAfterCompetition.add(activityPicker.props.scheduleWcif.numberOfDays, "d");

  // Only handle if the edit panel if not collapse
  if ($(`${schedulesEditPanelSelector}-body`)[0].offsetParent === null) {
    return true;
  }
  if (!activityPicker.props.keyboardEnabled) {
    return true;
  }
  let currentEventSelected = selectedEventInCalendar();
  switch (event.which) {
    case 72: // h
    // intentionally omitting the break
    case 37: // arrow left
      if (event.ctrlKey) {
        if (currentEventSelected) {
          let possibleStart = currentEventSelected.start.clone();
          possibleStart.subtract(1, "d");
          if (possibleStart.isAfter(startDate)) {
            currentEventSelected.start.subtract(1, "d");
            currentEventSelected.end.subtract(1, "d");
            eventModifiedInCalendar(currentEventSelected);
            $(scheduleElementSelector).fullCalendar("updateEvent", currentEventSelected);
          }
        }
      } else if (event.shiftKey) {
        activityPicker.trySetSelectedActivity("left");
      } else {
        trySetSelectedEvent("left");
      }
      break;
    case 74: // j
    // intentionally omitting the break
    case 40: // arrow down
      if (event.ctrlKey) {
        if (currentEventSelected) {
          currentEventSelected.end.add(5, "m");
          if (!event.shiftKey) {
            currentEventSelected.start.add(5, "m");
          }
          eventModifiedInCalendar(currentEventSelected);
          $(scheduleElementSelector).fullCalendar("updateEvent", currentEventSelected);
        }
      } else {
        if (event.shiftKey) {
          activityPicker.trySetSelectedActivity("down");
        } else {
          trySetSelectedEvent("down");
        }
      }
      break;
    case 75: // k
    // intentionally omitting the break
    case 38: // arrow up
      if (event.ctrlKey) {
        if (currentEventSelected) {
          currentEventSelected.end.subtract(5, "m");
          if (!event.shiftKey) {
            currentEventSelected.start.subtract(5, "m");
          }
          eventModifiedInCalendar(currentEventSelected);
          $(scheduleElementSelector).fullCalendar("updateEvent", currentEventSelected);
        }
      } else {
        if (event.shiftKey) {
          activityPicker.trySetSelectedActivity("up");
        } else {
          trySetSelectedEvent("up");
        }
      }
      break;
    case 76: // l
    // intentionally omitting the break
    case 39: // arrow right
      if (event.ctrlKey) {
        if (currentEventSelected) {
          let possibleStart = currentEventSelected.start.clone();
          possibleStart.add(1, "d");
          if (possibleStart.isBefore(firstDayAfterCompetition)) {
            currentEventSelected.start.add(1, "d");
            currentEventSelected.end.add(1, "d");
            eventModifiedInCalendar(currentEventSelected);
            $(scheduleElementSelector).fullCalendar("updateEvent", currentEventSelected);
          }
        }
      } else if (event.shiftKey) {
        activityPicker.trySetSelectedActivity("right");
      } else {
        trySetSelectedEvent("right");
      }
      break;
      // enter
    case 13:
      let $elemSelected = $(".selected-activity");
      if ($elemSelected.size() == 1) {
        addActivityToCalendar($elemSelected.data("event"));
      }
      break;
      // del
    case 46:
      if (currentEventSelected) {
        removeEventFromCalendar(currentEventSelected);
      }
      break;
    default:
      return true;
  }
  return false;
}


function trySetSelectedEvent(direction) {
  let currentEventSelected = selectedEventInCalendar();
  if (!currentEventSelected) {
    return;
  }
  let allEvents = _.sortBy($(scheduleElementSelector).fullCalendar("clientEvents"), ["start", "end"]);
  // groupBy preserve sorting
  let allGroupedEvents = _.groupBy(allEvents, value => value.start.day());
  if (direction === "up" || direction === "down") {
    let eventsForDay = allGroupedEvents[currentEventSelected.start.day()];
    // it must exist
    let index = _.findIndex(eventsForDay, { id: currentEventSelected.id });
    index += (direction === "up") ? -1 : +1;
    // '%' can return negative numbers, but 'nth' deals with them
    currentEventSelected = _.nth(eventsForDay, index % eventsForDay.length);
  } else if (direction === "right" || direction === "left") {
    const daySelected = currentEventSelected.start.day().toString();
    const allDays = Object.keys(allGroupedEvents);
    const newDayIndex = allDays.indexOf(daySelected) + (direction === "left" ? -1 : 1);
    currentEventSelected = allGroupedEvents[_.nth(allDays, newDayIndex % allDays.length)][0];
  }
  if (singleSelectEvent(currentEventSelected)) {
    $(scheduleElementSelector).fullCalendar("updateEvent", currentEventSelected)
  }
}
