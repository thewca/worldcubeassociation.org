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
import { newActivityId, defaultDurationFromActivityCode } from '../utils'

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
    eventAfterRender: (event, element) => {
      if (event.selected) {
        element.addClass("selected-fc-event");
      }
    },
    eventResizeStart: fullCalendarHandlers.onResizeStart,
    eventResizeStop: fullCalendarHandlers.onResizeStop,
    eventResize: fullCalendarHandlers.onSizeChanged,
    select: (start, end) => fullCalendarHandlers.onTimeframeSelected(showModalAction, start, end),
  }

  _.assign(options, localOptions);
  $(scheduleElementSelector).fullCalendar(options);
}

const fullCalendarHandlers = {
  onReceive: event => {
    // Fix the default duration
    let newEnd = event.start.clone();
    newEnd.add(defaultDurationFromActivityCode(event.activityCode), "m");
    event.end = newEnd;
    // We need to modify the original 'event' referenced here, so we won't
    // use 'dataToFcEvent'.
    // Set event title
    event.title = event.name;
    // Generate a new id
    event.id = newActivityId();
    // Add the event to the calendar (and to the WCIF schedule, but don't
    // render it as it's already done)
    addActivityToCalendar(fcEventToActivity(event), false);
    singleSelectEvent(event);
  },
  onDragStart: event => {
    // Visually remove any selected event
    $(".selected-fc-event").removeClass("selected-fc-event");
    $(contextualMenuSelector).addClass("hide-element");
    $(window).on("mousemove", dropAreaMouseMoveHandler);
  },
  onDragStop: (event, jsEvent) => {
    $(dropAreaSelector).removeClass("event-on-top");
    $(window).off("mousemove", dropAreaMouseMoveHandler);
    let removed = false;
    if (isEventOverDropArea(jsEvent)) {
      removed = removeEventFromCalendar(event);
    }
    if (!removed) {
      // Drag stop outside the drop area makes the event render without the selected-fc-event class
      singleSelectEvent(event);
    }
  },
  onMoved: eventModifiedInCalendar,
  onClick: (event, jsEvent) => {
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
    singleSelectEvent(event);
  },
  onResizeStart: event => {
    // Visually remove any selected event
    $(".selected-fc-event").removeClass("selected-fc-event");
    $(contextualMenuSelector).addClass("hide-element");
  },
  // Now that resizing is done, it's safe to actually update FC's internals
  onResizeStop: event => singleSelectEvent(event),
  onSizeChanged: eventModifiedInCalendar,
  onTimeframeSelected: (showModalAction, start, end) => {
    let eventProps = {
      title: commonActivityCodes["other-registration"],
      activityCode: "other-registration",
      start: start,
      end: end,
    }
    showModalAction(eventProps, "create");
  },
};
