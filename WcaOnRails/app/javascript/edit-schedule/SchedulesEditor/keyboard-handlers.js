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
import { activityIndexInArray } from 'wca/wcif-utils'

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
    // h
    case 72:
      // arrow left
    case 37:
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
      // j
    case 74:
      // arrow down
    case 40:
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
      // k
    case 75:
      // arrow up
    case 38:
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
      // l
    case 76:
      // arrow right
    case 39:
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
  let allGroupedEvents = _.groupBy(allEvents, function(value) { return value.start.day(); });
  if (direction == "up" || direction == "down") {
    let eventsForDay = allGroupedEvents[currentEventSelected.start.day()];
    // it must exist
    let index = activityIndexInArray(eventsForDay, currentEventSelected.id);
    index = (direction == "up") ? index - 1 : index + 1;
    // because '%' can return negative numbers
    index = ((index%eventsForDay.length) + eventsForDay.length) % eventsForDay.length;
    currentEventSelected = eventsForDay[index];
  } else if (direction == "right" || direction == "left") {
    let daySelected = currentEventSelected.start.day();
    let allDays = Object.keys(allGroupedEvents);
    // As a day may not have event, we need to find the closest one with one event
    // Thefore we loop through all of them in the expected order
    if (direction == "left") {
      allDays = _.reverse(allDays);
    }
    // Make sure the selected days is the first element
    while (allDays[0] != daySelected) {
      allDays.push(allDays.shift());
    }
    // Remove the current day from the selection
    allDays.splice(0, 1);
    // Basic for to be able to break out when found
    for (let i = 0; i < allDays.length; i++) {
      let eventsForDay = allGroupedEvents[allDays[i]];
      if (eventsForDay) {
        // if element exists in groupBy, then at least one event is there
        currentEventSelected = eventsForDay[0];
        break;
      }
    }
  }
  if (singleSelectEvent(currentEventSelected)) {
    $(scheduleElementSelector).fullCalendar("updateEvent", currentEventSelected)
  }
}
