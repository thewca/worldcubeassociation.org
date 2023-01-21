import _ from 'lodash';
import { events } from './wca-data.js.erb';

const dataByVenueId = {
};

window.wca = window.wca || {};

window.wca.registerVenueData = (id, venueData) => {
  dataByVenueId[id] = venueData;
};

const HEX_BASE = 16;

/**
 * Convert a HEX color code to RGB values.
 *
 * @param {string} hexColor HEX color code to convert to RGB
 *
 * @returns {Array<number>} RBG values, defaults to `[0, 0, 0]` if `hexColor` cannot be parsed
 */
const hexToRgb = (hexColor) => {
  if (/#[0-9A-Fa-f]{6}/.test(hexColor)) {
    return [
      parseInt(hexColor.slice(1, 3), HEX_BASE),
      parseInt(hexColor.slice(3, 5), HEX_BASE),
      parseInt(hexColor.slice(5, 7), HEX_BASE),
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
 * @param {string} backgroundColor Calendar item's background color (in HEX)
 *
 * @returns {string} white for "dark" backgrounds, black for "light" backgrounds
 */
const getTextColor = (backgroundColor) => {
  const [red, green, blue] = hexToRgb(backgroundColor);
  // formula from https://stackoverflow.com/a/3943023
  return (red * 0.299 + green * 0.587 + blue * 0.114) > 186 ? BLACK : WHITE;
};

const getCalendarElemId = (venueId) => `#calendar-venue-${venueId}`;
const getScheduleElemId = (venueId) => `#schedule-venue-${venueId}`;

const toggleScheduleView = (venueId, showTable) => {
  const $scheduleElem = $(getScheduleElemId(venueId));
  $scheduleElem.find('.schedule_table_container').toggle(showTable);
  $scheduleElem.find('.schedule_calendar_container').toggle(!showTable);
  $scheduleElem.find('.schedule-table-link').toggleClass('active', showTable);
  $scheduleElem.find('.schedule-calendar-link').toggleClass('active', !showTable);
};

// fullCalendar's events fetcher function.
// 'callback' must be called passing all events that should be rendered on the calendar
const fetchCalendarEvents = (venueId, start, end, timezone, callback) => {
  // We don't really care about timezone or start/end as we only have events for
  // a specific competition and venue.
  const allEvents = dataByVenueId[venueId].events;
  const rooms = $(`#room-list-${venueId}`).find('.selected');
  let calendarEvents = _.flatMap(rooms, (room) => _.filter(allEvents, { roomId: $(room).data('room') }));
  const selectedEvents = _.map(
    $(`#schedule-venue-${venueId} .events-filter > i.selected`),
    (e) => $(e).data('event').toString(),
  );
  // Filter events by id only if they are WCA events
  // (we don't want to filter custom activities for which event_id is "other").
  const filterableEventIds = Object.keys(events.byId);
  calendarEvents = _.filter(
    calendarEvents,
    (e) => selectedEvents.includes(e.activityDetails.event_id)
      || !filterableEventIds.includes(e.activityDetails.event_id),
  );
  callback(calendarEvents);
};

const GREY = '#666666';

const initFullCalendar = ($elem, calendarParams) => {
  const venueData = dataByVenueId[calendarParams.venueId];
  const options = {
    events: _.partial(fetchCalendarEvents, calendarParams.venueId),
    eventDataTransform: (eventData) => {
      const ev = eventData;
      if (ev.activityDetails.event_id.startsWith('other')) {
        ev.color = GREY;
      }
      ev.textColor = getTextColor(ev.color);
      return ev;
    },
    eventRender: (event, element) => {
      const popoverContent = calendarParams.popoverContentBuilder(event);
      const $element = $(element);
      if (!popoverContent) {
        return;
      }
      $element.addClass('has-popover');
      $element.click((e) => {
        // Hide other popovers to only have one at once.
        $('.has-popover').popover('hide');
        $(e.currentTarget).popover('toggle');
        e.stopPropagation();
      });
      $element.popover({
        title: `<strong>${event.title}</strong>`,
        container: 'body',
        html: true,
        content: `<div class="round-info-popover">${popoverContent}</div>`,
        trigger: 'manual',
        placement: 'top',
      });
    },
    defaultView: 'agendaForComp',
    header: false,
    allDaySlot: false,
    locale: calendarParams.locale,
    minTime: venueData.minTime,
    maxTime: venueData.maxTime,
    slotDuration: '00:15:00',
    height: 'auto',
    defaultDate: calendarParams.startDate,
    views: {
      agendaForComp: {
        type: 'agenda',
        duration: { days: calendarParams.numberOfDays },
        buttonText: 'Calendar',
      },
    },
  };
  $elem.fullCalendar(options);
};

const onClickCalencarLinkAction = (popoverContentBuilder, locale, startDate, numberOfDays, e) => {
  e.preventDefault();
  const venueId = $(e.currentTarget).data('venue');
  toggleScheduleView(venueId, false);
  const $calendar = $(getCalendarElemId(venueId));
  if (!$calendar.hasClass('initialized')) {
    $calendar.addClass('initialized');
    initFullCalendar($calendar, {
      locale, venueId, startDate, numberOfDays, popoverContentBuilder,
    });
  } else {
    $calendar.fullCalendar('refetchEvents');
  }
};

// Setup click event on "table" links (one for each venue)
const onClickTableLinkAction = (e) => {
  e.preventDefault();
  toggleScheduleView($(e.currentTarget).data('venue'), true);
};

const maybeRefreshEvents = (venueId) => {
  const $calendar = $(getCalendarElemId(venueId));
  const idSelector = getScheduleElemId(venueId);
  // Refetch event only if calendar is visible
  if ($(`${idSelector} .schedule-calendar-link`).hasClass('active')) {
    if ($calendar.hasClass('initialized')) {
      $calendar.fullCalendar('refetchEvents');
    }
  }
};

// Callback when the user click the "all" icon for events
const onClickAllAction = (e) => {
  // The "ALL" button
  const $allButton = $(e.currentTarget);
  // The whole filter with all events icons
  const $filter = $allButton.parent();

  const selectAll = !$allButton.hasClass('selected');
  $allButton.toggleClass('selected', selectAll);
  $filter.find('.cubing-icon').each((index, element) => {
    const $element = $(element);
    $element.toggleClass('selected', selectAll);
    const eventId = $element.data('event');
    // Table view action
    $(`.schedule-table .event-${eventId}`).toggleClass('event-selected', selectAll);
  });
  const venueId = $filter.data('venue');
  // Calendar action
  maybeRefreshEvents(venueId);
};

// Callback when the user click an event icon (actually updates *all* the filters in all venues)
const onClickEventIconAction = (e) => {
  // The event icon
  const $elem = $(e.currentTarget);
  const $filter = $elem.parent();
  // Event id for this event icon
  const eventId = $elem.data('event');

  // Toggle the event visibility
  $elem.toggleClass('selected');
  $(`.schedule-table .event-${eventId}`).toggleClass('event-selected');

  // The whole filter with all events icons contains the venue id
  const venueId = $filter.data('venue');

  // Calendar action
  maybeRefreshEvents(venueId);

  // Now check if we should change the "ALL" buttons status
  const $allButton = $filter.find('.event-all').first();
  const allEvents = $filter.find('.cubing-icon');
  const selectedEvents = $filter.find('.cubing-icon.selected');
  $allButton.toggleClass('selected', allEvents.length === selectedEvents.length);
};

// Callback when the user click on a room's name
const onClickOnRoomAction = (e) => {
  e.preventDefault();
  // Starts by hiding all popovers
  $('.has-popover').popover('hide');

  const $room = $(e.currentTarget);
  const roomId = $room.data('room');
  const venueId = $room.data('venue');

  // Toggle the room line's status
  $room.find('input').prop('checked', !$room.hasClass('selected'));
  $room.toggleClass('selected');
  // Action for the Table view
  $(`.room-${roomId}`).toggleClass('room-selected');

  // Avoid focus on the line
  $room.blur();

  // Action for the calendar
  maybeRefreshEvents(venueId);
};

window.wca.setupCalendarAndFilter = (popoverContentBuilder, locale, startDate, numberOfDays) => {
  // Setup click action on calendar links
  $('.schedule-calendar-link').click(_.partial(
    onClickCalencarLinkAction,
    popoverContentBuilder,
    locale,
    startDate,
    numberOfDays,
  ));
  $('.schedule-table-link').click(onClickTableLinkAction);

  // Setup events filter actions
  $('.events-filter .event-all').click(onClickAllAction);
  $('.events-filter i.cubing-icon').click(onClickEventIconAction);

  // Setup rooms filter action
  $('.toggle-room').click(onClickOnRoomAction);

  // Hide popovers with round's information whenever we click somewhere
  $('body').click(() => $('.has-popover').popover('hide'));
};
