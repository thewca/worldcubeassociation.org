
const dataByVenueId = {
};

wca.registerVenueData = (id, venueData) => {
  dataByVenueId[`${id}`] = venueData;
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

// Setup click event on "table" links (one for each venue)
const onClickTableLinkAction = e => {
  e.preventDefault();
  let venueId = $(e.currentTarget).data("venue");
  let idSelector = getScheduleElemId(venueId);
  $(idSelector + " .schedule_calendar_container").hide();
  $(idSelector + " .schedule-calendar-link").removeClass("active");
  $(idSelector + " .schedule_table_container").show();
  $(idSelector + " .schedule-table-link").addClass("active");
}

const onClickCalencarLinkAction = (popoverContentBuilder, locale, startDate, numberOfDays, e) => {
  e.preventDefault();
  let venueId = $(e.currentTarget).data("venue");
  let idSelector = getScheduleElemId(venueId);
  $(idSelector + " .schedule_table_container").hide();
  $(idSelector + " .schedule-table-link").removeClass("active");
  $(idSelector + " .schedule_calendar_container").show();
  $(idSelector + " .schedule-calendar-link").addClass("active");
  $calendar = $(getCalendarElemId(venueId));
  if (!$calendar.hasClass("initialized")) {
    $calendar.addClass("initialized");
    let calendarParams = {
      locale: locale,
      venueId: venueId,
      startDate: startDate,
      numberOfDays: numberOfDays,
      popoverContentBuilder: popoverContentBuilder,
    };
    initFullCalendar($calendar, calendarParams);
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

  if ($allButton.hasClass("selected")) {
    // If "ALL" was active, we want to unselect all
    $filter.find(".cubing-icon.selected").each(function(index, element) {
      $element = $(element);
      $element.removeClass("selected");
      let eventId = $element.data("event");
      // Table view action
      $(".schedule-table .event-" + eventId).removeClass("event-selected");
    });
    $allButton.removeClass("selected");
  } else {
    $filter.find(".cubing-icon:not(.selected)").each(function(index, element) {
      $element = $(element);
      $element.addClass("selected");
      let eventId = $element.data("event");
      // Table view action
      $(".schedule-table .event-" + eventId).addClass("event-selected");
    });
    $allButton.addClass("selected");
  }
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
  if ($elem.hasClass("selected")) {
    $elem.removeClass("selected");
    // Table action
    $(".schedule-table .event-" + eventId).removeClass("event-selected");
  } else {
    $elem.addClass("selected");
    // Table action
    $(".schedule-table .event-" + eventId).addClass("event-selected");
  }

  // The whole filter with all events icons contains the venue id
  let venueId = $filter.data("venue");

  // Calendar action
  maybeRefreshEvents(venueId);

  // Now check if we should change the "ALL" buttons status
  $allButton = $filter.find(".event-all").first();
  let allEvents = $filter.find(".cubing-icon");
  let selectedEvents = $filter.find(".cubing-icon.selected");
  if (allEvents.length != selectedEvents.length) {
    $allButton.removeClass("selected");
  } else {
    if (!$allButton.hasClass("selected")) {
      $allButton.addClass("selected");
    }
  }
}

// Callback when the user click on a room's name
const onClickOnRoomAction = e => {
  e.preventDefault();
  // Starts by hiding all popovers
  $(".has-popover").popover("hide");

  var $room = $(e.currentTarget);
  var roomId = $room.data("room");
  var venueId = $room.data("venue");

  // Toggle the room line's status
  if ($room.hasClass("selected")) {
    $room.removeClass("selected");
    $room.find("input").prop("checked", false);
    // Action for the Table view
    $(".room-" + roomId).removeClass("room-selected");
  } else {
    $room.addClass("selected");
    $room.find("input").prop("checked", true);
    // Action for the Table view
    $(".room-" + roomId).addClass("room-selected");
  }

  // Avoid focus on the line
  $room.blur();

  // Action for the calendar
  maybeRefreshEvents(venueId);
}

const maybeRefreshEvents = venueId => {
  $calendar = $(getCalendarElemId(venueId));
  var idSelector = getScheduleElemId(venueId);
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
function fetchCalendarEvents(venueId, start, end, timezone, callback) {
  // We don't really care about timezone or start/end as we only have events for a specific competition and venue.
  var venueData = dataByVenueId[venueId];
  var allEvents = venueData.events;
  var rooms = $("#room-list-" + venueId).find(".selected");
  var events = _.flatMap(rooms, function(room) {
    let roomId = $(room).data("room");
    return _.filter(allEvents, { roomId });
  });
  var selectedEvents = _.map($("#schedule-venue-" + venueId + " .events-filter > span.selected"), e => $(e).data("event").toString());
  events = _.filter(events, e => selectedEvents.includes(e.activityDetails.event_id));
  callback(events);
}
