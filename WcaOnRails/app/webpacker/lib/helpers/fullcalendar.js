import _ from 'lodash';

import fullCalendarDefaultOptions from '../fullcalendar';
import { contextualMenuSelector } from '../../components/SchedulesEditor/ContextualMenu';
import { commonActivityCodes } from '../../components/SchedulesEditor/CustomActivity';
import { dropAreaMouseMoveHandler, dropAreaSelector, isEventOverDropArea } from '../../components/SchedulesEditor/DropArea';
import {
  addActivityToCalendar,
  dataToFcEvent,
  eventModifiedInCalendar,
  fcEventToActivity,
  removeEventFromCalendar,
  singleSelectEvent,
} from '../utils/calendar';
import { newActivityId, defaultDurationFromActivityCode } from '../utils/edit-schedule';
import { scheduleElementSelector } from './edit-schedule';

const fullCalendarHandlers = {
  onReceive: (ev) => {
    const event = ev;
    // Fix the default duration
    const newEnd = event.start.clone();
    newEnd.add(defaultDurationFromActivityCode(event.activityCode), 'm');
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
  onDragStart: () => {
    // Visually remove any selected event
    $('.selected-fc-event').removeClass('selected-fc-event');
    $(contextualMenuSelector).addClass('hide-element');
    $(window).on('mousemove', dropAreaMouseMoveHandler);
  },
  onDragStop: (event, jsEvent) => {
    $(dropAreaSelector).removeClass('event-on-top');
    $(window).off('mousemove', dropAreaMouseMoveHandler);
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
    const $menu = $(contextualMenuSelector);
    $menu.removeClass('delete-only');
    // See https://github.com/fullcalendar/fullcalendar/issues/3324
    // We can't use a context menu without running into this bug, so instead we use shift+click
    if (jsEvent.which === 1 && jsEvent.shiftKey) {
      $menu.data('event', event);
      if (!event.activityCode.startsWith('other-')) {
        $menu.addClass('delete-only');
      }
      $menu.removeClass('hide-element');
      $menu.position({ my: 'left top', of: jsEvent });
      // avoid it being immediately hidden by our window click listener
      jsEvent.stopPropagation();
    } else {
      $menu.addClass('hide-element');
    }
    singleSelectEvent(event);
  },
  onResizeStart: () => {
    // Visually remove any selected event
    $('.selected-fc-event').removeClass('selected-fc-event');
    $(contextualMenuSelector).addClass('hide-element');
  },
  // Now that resizing is done, it's safe to actually update FC's internals
  onResizeStop: (event) => singleSelectEvent(event),
  onSizeChanged: eventModifiedInCalendar,
  onTimeframeSelected: (showModalAction, start, end) => {
    const eventProps = {
      title: commonActivityCodes['other-checkin'],
      activityCode: 'other-checkin',
      start,
      end,
    };
    showModalAction(eventProps, 'create');
  },
};

export default function generate(eventFetcher, showModalAction, scheduleWcif, additionalOptions) {
  const options = fullCalendarDefaultOptions(scheduleWcif.startDate, scheduleWcif.numberOfDays);
  _.assign(options, additionalOptions);

  const localOptions = {
    // Having only one view for edition enable us to have a "static" list of event
    // If we had more, we would need a function to fetch them every time
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
        element.addClass('selected-fc-event');
        // FC automatically add a border color in the "style" attribute based on the event color :(
        // I couldn't find a way around it, so the simpler is to simply reset it here.
        element.css('border-color', '');
      }
    },
    eventResizeStart: fullCalendarHandlers.onResizeStart,
    eventResizeStop: fullCalendarHandlers.onResizeStop,
    eventResize: fullCalendarHandlers.onSizeChanged,

    // We need to set selectMinDistance greater than 0 to suppress `select`
    // events when the user simply single clicks (and does not drag) on the
    // calendar. See https://fullcalendar.io/docs/selectMinDistance.
    // I have no idea why this isn't the default behavior.
    selectMinDistance: 5,
    select: (start, end) => fullCalendarHandlers.onTimeframeSelected(showModalAction, start, end),
    dayClick: (date) => fullCalendarHandlers.onTimeframeSelected(
      showModalAction,
      date,
      date.clone().add(window.moment.duration(options.defaultTimedEventDuration)),
    ),
  };

  _.assign(options, localOptions);
  $(scheduleElementSelector).fullCalendar(options);
}
