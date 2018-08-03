import events from 'wca/events.js.erb'

const dataByVenueId = {
};

wca.registerVenueData = (id, venueData) => {
  dataByVenueId[id] = venueData;
}

wca.setupCalendarAndFilter = (popoverContentBuilder, locale, startDate, numberOfDays) => {
  // Setup click action on calendar links
  $(".schedule-calendar-link").click(_.partial(onClickCalencarLinkAction,
                                               popoverContentBuilder,
                                               locale,
                                               startDate,
                                               numberOfDays));
  $(".schedule-table-link").click(onClickTableLinkAction);

  // Setup events filter actions
  $(".events-filter .event-all").click(onClickAllAction);
  $(".events-filter span.cubing-icon").click(onClickEventIconAction);

  // Setup rooms filter action
  $(".toggle-room").click(onClickOnRoomAction);

  // Hide popovers with round's information whenever we click somewhere
  $('body').click(() => $(".has-popover").popover("hide"));
}

const getCalendarElemId = venueId => `#calendar-venue-${venueId}`;
const getScheduleElemId = venueId => `#schedule-venue-${venueId}`;

const toggleScheduleView = (venueId, showTable) => {
  let $scheduleElem = $(getScheduleElemId(venueId));
  $scheduleElem.find(".schedule_table_container").toggle(showTable);
  $scheduleElem.find(".schedule_calendar_container").toggle(!showTable);
  $scheduleElem.find(".schedule-table-link").toggleClass("active", showTable);
  $scheduleElem.find(".schedule-calendar-link").toggleClass("active", !showTable);
};

// Setup click event on "table" links (one for each venue)
const onClickTableLinkAction = e => {
  e.preventDefault();
  toggleScheduleView($(e.currentTarget).data("venue"), true);
}

const onClickCalencarLinkAction = (popoverContentBuilder, locale, startDate, numberOfDays, e) => {
  e.preventDefault();
  let venueId = $(e.currentTarget).data("venue");
  toggleScheduleView(venueId, false);
  let $calendar = $(getCalendarElemId(venueId));
  if (!$calendar.hasClass("initialized")) {
    $calendar.addClass("initialized");
    initFullCalendar($calendar, {
      locale, venueId, startDate, numberOfDays, popoverContentBuilder
    });
  } else {
    $calendar.fullCalendar("refetchEvents");
  }
}

// Callback when the user click the "all" icon for events
const onClickAllAction = e => {
  // The "ALL" button
  let $allButton = $(e.currentTarget);
  // The whole filter with all events icons
  let $filter = $allButton.parent();

  let selectAll = !$allButton.hasClass("selected");
  $allButton.toggleClass("selected", selectAll);
  $filter.find(".cubing-icon").each((index, element) => {
    let $element = $(element);
    $element.toggleClass("selected", selectAll);
    let eventId = $element.data("event");
    // Table view action
    $(".schedule-table .event-" + eventId).toggleClass("event-selected", selectAll);
  });
  let venueId = $filter.data("venue");
  // Calendar action
  maybeRefreshEvents(venueId);
}

// Callback when the user click an event icon (actually updates *all* the filters in all venues)
const onClickEventIconAction = e => {
  // The event icon
  let $elem = $(e.currentTarget);
  let $filter = $elem.parent();
  // Event id for this event icon
  let eventId = $elem.data("event");

  // Toggle the event visibility
  $elem.toggleClass("selected");
  $(".schedule-table .event-" + eventId).toggleClass("event-selected");

  // The whole filter with all events icons contains the venue id
  let venueId = $filter.data("venue");

  // Calendar action
  maybeRefreshEvents(venueId);

  // Now check if we should change the "ALL" buttons status
  let $allButton = $filter.find(".event-all").first();
  let allEvents = $filter.find(".cubing-icon");
  let selectedEvents = $filter.find(".cubing-icon.selected");
  $allButton.toggleClass("selected", allEvents.length === selectedEvents.length);
}

// Callback when the user click on a room's name
const onClickOnRoomAction = e => {
  e.preventDefault();
  // Starts by hiding all popovers
  $(".has-popover").popover("hide");

  let $room = $(e.currentTarget);
  let roomId = $room.data("room");
  let venueId = $room.data("venue");

  // Toggle the room line's status
  $room.find("input").prop("checked", !$room.hasClass("selected"));
  $room.toggleClass("selected");
  // Action for the Table view
  $(".room-" + roomId).toggleClass("room-selected");

  // Avoid focus on the line
  $room.blur();

  // Action for the calendar
  maybeRefreshEvents(venueId);
}

const maybeRefreshEvents = venueId => {
  let $calendar = $(getCalendarElemId(venueId));
  let idSelector = getScheduleElemId(venueId);
  // Refetch event only if calendar is visible
  if ($(idSelector + " .schedule-calendar-link").hasClass("active")) {
    if ($calendar.hasClass("initialized")) {
      $calendar.fullCalendar("refetchEvents");
    }
  }
}

const initFullCalendar = ($elem, calendarParams) => {
  let venueData = dataByVenueId[calendarParams.venueId];
  let options = {
    events: _.partial(fetchCalendarEvents, calendarParams.venueId),
    eventDataTransform: eventData => {
      if (eventData.activityDetails.event_id.startsWith("other")) {
        eventData.color = "#666";
      }
      return eventData;
    },
    eventRender: (event, element) => {
      let popoverContent = calendarParams.popoverContentBuilder(event);
      let $element = $(element);
      if (!popoverContent) {
        return;
      }
      $element.addClass("has-popover");
      $element.click(e => {
        // Hide other popovers to only have one at once.
        $(".has-popover").popover("hide")
        $(e.currentTarget).popover("toggle");
        e.stopPropagation();
      });
      $element.popover({
        title: `<strong>${event.title}</strong>`,
        container: "body",
        html: true,
        content: `<div class="round-info-popover">${popoverContent}</div>`,
        trigger: "manual",
        placement: "top",
      });
    },
    defaultView: 'agendaForComp',
    header: false,
    allDaySlot: false,
    locale: calendarParams.locale,
    minTime: venueData.minTime,
    maxTime: venueData.maxTime,
    slotDuration: "00:30:00",
    height: "auto",
    defaultDate: calendarParams.startDate,
    views: {
      agendaForComp: {
        type: 'agenda',
        duration: { days: calendarParams.numberOfDays },
        buttonText: 'Calendar',
      },
    },
  }
  $elem.fullCalendar(options);
}


// fullCalendar's events fetcher function.
// 'callback' must be called passing all events that should be rendered on the calendar
const fetchCalendarEvents = (venueId, start, end, timezone, callback) => {
  // We don't really care about timezone or start/end as we only have events for a specific competition and venue.
  let allEvents = dataByVenueId[venueId].events;
  let rooms = $("#room-list-" + venueId).find(".selected");
  let calendarEvents = _.flatMap(rooms, room =>
      _.filter(allEvents, { roomId: $(room).data("room") })
  );
  let selectedEvents = _.map($("#schedule-venue-" + venueId + " .events-filter > span.selected"), e => $(e).data("event").toString());
  // Filter events by id only if they are WCA events (we don't want to filter custom activities for which event_id is "other").
  let filterableEventIds = Object.keys(events.byId);
  calendarEvents = _.filter(calendarEvents, e =>
    selectedEvents.includes(e.activityDetails.event_id) || !filterableEventIds.includes(e.activityDetails.event_id)
  );
  callback(calendarEvents);
}
