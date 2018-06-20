import _ from 'lodash'

import { contextualMenuSelector } from './ContextualMenu'
import { calendarOptionsInfo } from './ScheduleToolbar'
import { commonActivityCodes } from './CustomActivity'
import { dropAreaMouseMoveHandler, dropAreaSelector, isEventOverDropArea } from './DropArea'
import { fullCalendarDefaultOptions } from 'wca/fullcalendar'
import {
  addActivityToCalendar,
  dataToFcEvent,
  eventModifiedInCalendar,
  fcEventToActivity,
  removeEventFromCalendar,
  singleSelectEvent,
} from './calendar-utils'
import { defaultDurationFromActivityCode } from '../utils'

export const scheduleElementSelector = "#schedule-calendar";

export function generateCalendar(eventFetcher, showModalAction, scheduleWcif, locale) {
  let options = fullCalendarDefaultOptions(scheduleWcif.startDate, scheduleWcif.numberOfDays);

  let localOptions = {
    locale: locale,
    // Having only one view for edition enable us to have a "static" list of event
    // If we had more, we would need a function to fetch them everytime
    events: eventFetcher,
    editable: true,
    droppable: true,
    selectable: true,
    dragRevertDuration: 0,
    eventDataTransform: dataToFcEvent,
    eventReceive: fullCalendarHandlers.onReceive,
    eventDragStart: fullCalendarHandlers.onDragStart,
    eventDragStop: fullCalendarHandlers.onDragStop,
    eventDrop: fullCalendarHandlers.onMoved,
    eventClick: fullCalendarHandlers.onClick,
    eventAfterRender: function(event, element) {
      if (event.selected) {
        element.addClass("selected-fc-event");
      }
    },
    eventResizeStart: fullCalendarHandlers.onResizeStart,
    eventResizeStop: fullCalendarHandlers.onResizeStop,
    eventResize: fullCalendarHandlers.onSizeChanged,
    select: function(start, end) {
      fullCalendarHandlers.onTimeframeSelected(showModalAction, start, end);
    },
  }

  _.assign(options, localOptions);
  $(scheduleElementSelector).fullCalendar(options);
}

const fullCalendarHandlers = {
  onReceive: function(event) {
    // Fix the default duration
    let newEnd = event.start.clone();
    newEnd.add(defaultDurationFromActivityCode(event.activityCode), "m");
    event.end = newEnd;
    // Add the event to the calendar (and to the WCIF schedule, but don't
    // render it as it's already done
    addActivityToCalendar(fcEventToActivity(event), false);
    if (singleSelectEvent(event)) {
      $(scheduleElementSelector).fullCalendar("updateEvent", event);
    }
  },
  onDragStart: function(event) {
    singleSelectEvent(event);
    $(contextualMenuSelector).addClass("hide-element");
    $(window).on("mousemove", dropAreaMouseMoveHandler);
  },
  onDragStop: function(event, jsEvent) {
    $(dropAreaSelector).removeClass("event-on-top");
    $(window).off("mousemove", dropAreaMouseMoveHandler);
    let removed = false;
    if (isEventOverDropArea(jsEvent)) {
      removed = removeEventFromCalendar(event);
    }
    if (!removed) {
      // Drag stop outside the drop area makes the event render without the selected-fc-event class
      $(scheduleElementSelector).fullCalendar("updateEvent", event);
    }
  },
  onMoved: eventModifiedInCalendar,
  onClick: function(event, jsEvent) {
    let $menu = $(contextualMenuSelector);
    $menu.removeClass("delete-only");
    // See https://github.com/fullcalendar/fullcalendar/issues/3324
    // We can't use a context menu without running into this bug, so instead we use shift+click
    if (jsEvent.which == 1 && jsEvent.shiftKey) {
      $menu.data("event", event);
      if (!event.activityCode.startsWith("other-")) {
        $menu.addClass("delete-only");
      }
      $menu.removeClass("hide-element");
      $menu.position({ my: "left top", of: jsEvent});
      // avoid it being immediately hiddent by our window click listener
      jsEvent.stopPropagation();
    } else {
      $menu.addClass("hide-element");
    }
    if (singleSelectEvent(event)) {
      $(scheduleElementSelector).fullCalendar("updateEvent", event);
    }
  },
  onResizeStart: function(event) {
    singleSelectEvent(event);
    // We can't rerender or update here, otherwise FC internal state gets messed up
    // So we do a trick: an fc-event able to be resized receive the class 'fc-allow-mouse-resize'
    $(".fc-allow-mouse-resize").addClass("selected-fc-event");
    $(contextualMenuSelector).addClass("hide-element");
  },
  onResizeStop: function(event) {
    $(scheduleElementSelector).fullCalendar("updateEvent", event);
  },
  onSizeChanged: eventModifiedInCalendar,
  onTimeframeSelected: function(showModalAction, start, end) {
    let eventProps = {
      name: commonActivityCodes["other-registration"],
      activityCode: "other-registration",
      start: start,
      end: end,
    }
    showModalAction(eventProps, "create");
  },
};
