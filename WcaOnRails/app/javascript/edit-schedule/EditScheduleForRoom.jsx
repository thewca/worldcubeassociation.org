import React from 'react'
import cn from 'classnames'
import events from 'wca/events.js.erb'
import formats from 'wca/formats.js.erb'
import _ from 'lodash'
import ReactDOM from 'react-dom'
import { parseActivityCode, roundIdToString } from 'edit-events/modals/utils'
import { Button, ButtonToolbar, Modal, Panel, Tooltip, OverlayTrigger, Popover } from 'react-bootstrap';
import { rootRender } from 'edit-schedule'
import { newActivityId } from './EditSchedule'

function NoRoomSelected() {
  return (
    <div>Please select a room to edit its schedule</div>
  );
}

const tzConverterHandlers = {
};

function activityToFcEvent(eventData) {
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
  // We'll add back the room's timezone when exporting the WCIF
  if (eventData.hasOwnProperty("startTime")) {
    eventData.start = tzConverterHandlers.isoStringToAmbiguousMoment(eventData.startTime);
  }
  if (eventData.hasOwnProperty("endTime")) {
    eventData.end = tzConverterHandlers.isoStringToAmbiguousMoment(eventData.endTime);
  }
  return eventData;
};

function fcEventToActivity(event) {
  // Build a cleaned up activity from a FullCalendar event
  let activity = {
    id: event.id,
    name: event.title,
    activityCode: event.activityCode,
  };
  if (event.hasOwnProperty("start")) {
    activity.startTime = tzConverterHandlers.ambiguousMomentToIsoString(event.start);
  }
  if (event.hasOwnProperty("end")) {
    activity.endTime = tzConverterHandlers.ambiguousMomentToIsoString(event.end);
  }
  if (event.hasOwnProperty("childActivities")) {
    // Not modified by FC, put them back anyway
    activity.childActivities = event.childActivities;
  } else {
    activity.childActivities = [];
  }
  return activity;
}

function roomWcifFromId(scheduleWcif, id) {
  if (id.length > 0) {
    for (let i = 0; i < scheduleWcif.venues.length; i++) {
      let venue = scheduleWcif.venues[i];
      for (let j = 0; j < venue.rooms.length; j++) {
        let room = venue.rooms[j];
        if (id == room.id) {
          return room;
        }
      }
    }
  }
  return null;
}

function venueWcifFromRoomId(scheduleWcif, id) {
  if (id.length > 0) {
    for (let i = 0; i < scheduleWcif.venues.length; i++) {
      let venue = scheduleWcif.venues[i];
      for (let j = 0; j < venue.rooms.length; j++) {
        let room = venue.rooms[j];
        if (id == room.id) {
          return venue;
        }
      }
    }
  }
  return null;
}

function activityIndexInArray(activities, id) {
  for (let i = 0; i < activities.length; i++) {
    if (activities[i].id == id) {
      return i;
    }
  }
  return -1;
}

function activityCodeListFromWcif(scheduleWcif) {
  let usedActivityCodeList = [];
  scheduleWcif.venues.forEach(function(venue, index) {
    venue.rooms.forEach(function(room, index) {
      let activityCodes = room.activities.map(function(element) {
        return element.activityCode;
      });
      usedActivityCodeList.push(...activityCodes);
    });
  });
  return usedActivityCodeList;
}

function selectedEventInCalendar() {
  let matching = $(scheduleElementId).fullCalendar("clientEvents", function(event) { return event.selected; });
  return matching.length > 0 ? matching[0] : null;
}


function RoomSelector({ scheduleWcif, selectedRoom, handleRoomChange }) {
  let options = [
    <option key="0" value=""></option>
  ];

  scheduleWcif.venues.forEach(function (venue, venueIndex) {
    venue.rooms.forEach(function (room, roomIndex) {
      options.push(<option key={ room.id } value={ room.id }>"{room.name}" in "{venue.name}"</option>);
    });
  });

  return (
    <div className="row room-selector">
        <label htmlFor="venue-room-selector" className="control-label col-xs-12 col-md-6 col-lg-5">
          Select a room to edit its schedule:
        </label>
        <div className="col-xs-12 col-md-6 col-lg-7">
          <select id="venue-room-selector" className="form-control input-sm" onChange={handleRoomChange} value={selectedRoom}>
            {options}
          </select>
        </div>
    </div>
  );
}


const isEventOverTrash = function(jsEvent) {
  let trashElem = $('#drop-event-area');

  // Base trash position
  let trashPosition = trashElem.offset();

  // Fix the trash position with vertical scroll
  let scrolled = $(window).scrollTop();
  trashPosition.top -= scrolled;

  // Compute remaining coordinates
  trashPosition.right = trashPosition.left + trashElem.width();
  trashPosition.bottom = trashPosition.top + trashElem.height();

  return jsEvent.clientX >= trashPosition.left
           && jsEvent.clientX <= trashPosition.right
           && jsEvent.clientY >= trashPosition.top
           && jsEvent.clientY <= trashPosition.bottom;
}

const scheduleElementId = "#schedule-calendar";

const commonActivityCodes = {
  "other-registration": "Registration",
  "other-breakfast": "Breakfast",
  "other-lunch": "Lunch",
  "other-dinner": "Dinner",
  "other-awards": "Awards",
  "other-misc": "Other",
};


const defaultDurationFromActivityCode = activityCode => {
  let { eventId } = parseActivityCode(activityCode);
  if (eventId == "333fm" || eventId == "333mbf"
      || activityCode == "other-lunch" || activityCode == "other-awards") {
    return 60;
  } else {
    return 30;
  }
}

class CustomActivityModal extends React.Component {
  // FIXME: extract to standalone file

  componentWillMount() {
    this.setState({
      ...this.props.eventProps
    });
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      ...newProps.eventProps
    });
  }

  render () {
    let { show, handleHideModal, actionDetails, eventProps } = this.props;
    let { modalTitle, buttonText, action } = actionDetails;
    let timeText = "No time selected";
    if (eventProps.start && eventProps.end) {
      timeText = `On ${eventProps.start.format("dddd, MMMM Do YYYY")}, from ${eventProps.start.format("H:mm")} to ${eventProps.end.format("H:mm")}.`;
    }

    let handlePropChange = (propName, e) => {
      let newState = {};
      newState[propName] = e.target.value;
      if (propName == "activityCode") {
        // On change of activity code, we can update the activity name to the default
        newState.name = commonActivityCodes[newState.activityCode];
      }
      this.setState(newState);
    };

    return (
      <Modal show={show} onHide={handleHideModal} container={this}>
        <Modal.Header closeButton>
        <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="form-horizontal row">
          <div className="form-group">
            <div className="control-label col-xs-3">
              <label>Type of activity</label>
            </div>
            <div className="col-xs-8">
              <select className="form-control" id="activity_code" value={this.state.activityCode} onChange={e => handlePropChange("activityCode", e)}>
                {Object.keys(commonActivityCodes).map(function(key) {
                  return <option key={key} value={key}>{commonActivityCodes[key]}</option>
                })}
              </select>
            </div>
          </div>
          <div className="form-group">
            <div className="control-label col-xs-3">
              <label>Name</label>
            </div>
            <div className="col-xs-8">
              <input className="form-control" type="text" id="activity_name" value={this.state.name} onChange={e => handlePropChange("name", e)}/>
            </div>
          </div>
          <div className="form-group">
            <div className="col-xs-10 col-xs-offset-2">
              {timeText}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => action(this.state)} bsStyle="success">{buttonText}</Button>
          <Button onClick={handleHideModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

const calendarOptionsInfo = {
  slotDuration: {
    label: "Minutes per row",
    defaultValue: "00:30:00",
    options: {
      "5": "00:05:00",
      "15": "00:15:00",
      "20": "00:20:00",
      "30": "00:30:00",
    },
  },
  minTime: {
    label: "Calendar starts at",
    defaultValue: "8:00:00",
    options: hours(),
  },
  maxTime: {
    label: "Calendar ends at",
    defaultValue: "20:00:00",
    options: hours(),
  },
};

const CalendarSettingsOption = ({selected, optionName, handlePropChange}) => {
  let optionProps = calendarOptionsInfo[optionName];
  return (
    <div className="col-xs-12">
      <div className="row">
        <div className="col-xs-6 setting-label">
          {optionProps.label}
        </div>
        <div className="col-xs-6">
          <select className="form-control" value={selected} onChange={e => handlePropChange(optionName, e)}>
            {_.map(optionProps.options, function(value, key) {
              return (<option key={value} value={value}>{key}</option>)
            })}
          </select>
        </div>
      </div>
    </div>
  );
}

function hours() {
  let options = {};
  for (let i = 0; i < 24; i++) {
    options[i] = `${i}:00:00`;
  }
  return options;
}

const CalendarSettings = ({ currentSettings, handlePropChange, ...props}) => {
// See https://github.com/react-bootstrap/react-bootstrap/issues/1345#issuecomment-142133819
// for why we pass down ...props
  return (
    <Popover id="calendar-settings-popover" title="Calendar settings" {...props} >
      <div className="row">
        {Object.keys(calendarOptionsInfo).map(function(optionName) {
          return (
            <CalendarSettingsOption optionName={optionName}
                                    key={optionName}
                                    selected={currentSettings[optionName]}
                                    handlePropChange={handlePropChange}
            />
          );
        })}
      </div>
    </Popover>
  );
}

const CalendarHelp = ({ ...props }) => {
// See https://github.com/react-bootstrap/react-bootstrap/issues/1345#issuecomment-142133819
// for why we pass down ...props
  return (
    <Popover id="calendar-help-popover" title="Keyboard shortcuts help" {...props} >
      <dl className="row">
        <dt className="col-xs-4"><i className="fa fa-keyboard-o"/> or<br/> [C] + i</dt>
        <dd className="col-xs-8">Toggle keyboard shortcuts</dd>
        <dt className="col-xs-4">Arrow keys</dt>
        <dd className="col-xs-8">Change selected event in calendar</dd>
        <dt className="col-xs-4">[S] + Arrow keys</dt>
        <dd className="col-xs-8">Change selected activity in picker</dd>
        <dt className="col-xs-4">[Enter]</dt>
        <dd className="col-xs-8">Add selected activity after selected event</dd>
        <dt className="col-xs-4">[Del]</dt>
        <dd className="col-xs-8">Remove selected event</dd>
        <dt className="col-xs-4">[C] + Arrow keys</dt>
        <dd className="col-xs-8">Move selected event around in calendar</dd>
        <dt className="col-xs-4">[C] + [S] + up/down</dt>
        <dd className="col-xs-8">Shrink/Expand selected event in calendar</dd>
        <dt className="col-xs-4">[C] + [S] + click</dt>
        <dd className="col-xs-8">Show contextual menu for event</dd>
      </dl>
      <hr />
      <b>[C]:</b> ctrl key, <b>[S]:</b> shift key
    </Popover>
  );
}

function singleSelectEvent(event) {
  // return if the event has been updated or not
  if (event.selected) {
    return false;
  }
  let events = $(scheduleElementId).fullCalendar("clientEvents");
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
};

const tooltipSettings = (
  <Tooltip id="tooltip-calendar-settings">
    Click to change the calendar's settings.
  </Tooltip>
);

const TooltipKeyboard = ({ enabled, ...props }) => (
  <Tooltip id="tooltip-enable-keyboard" {...props}>
    Click to { enabled ? "disable" : "enable" } keyboard shortcuts
  </Tooltip>
);

function dragOnMouseMove(jsEvent) {
  // FIXME: id to const
  if (isEventOverTrash(jsEvent)) {
    $('#drop-event-area').addClass("event-on-top");
  } else {
    $('#drop-event-area').removeClass("event-on-top");
  }
}

function singleSelectLastEvent(scheduleWcif, selectedRoom) {
  let room = roomWcifFromId(scheduleWcif, selectedRoom);
  if (room) {
    if (room.activities.length > 0) {
      let lastActivity = room.activities[room.activities.length - 1];
      let fcEvent = $(scheduleElementId).fullCalendar("clientEvents", lastActivity.id)[0];
      if (singleSelectEvent(fcEvent)) {
        $(scheduleElementId).fullCalendar("updateEvent", fcEvent);
      }
    }
  }
}

const calendarHandlers = {};

class EditScheduleForRoom extends React.Component {

  getEvents = () => {
    // Return a deep clone, otherwise FC will add some extra attributes that
    // will make the parent component think some changes have been made...
    return _.cloneDeep(roomWcifFromId(this.props.scheduleWcif, this.state.selectedRoom).activities);
  }

  componentWillMount() {
    let calendarOptions = {};

    Object.keys(calendarOptionsInfo).forEach(function(optionName) {
      calendarOptions[optionName] = calendarOptionsInfo[optionName].defaultValue;
    });

    this.setState({
      selectedRoom: this.props.selectedRoom,
      showModal: false,
      eventProps: { name: "", activityCode: "" },
      actionDetails: { modalTitle: "", action: () => {}, buttonText: ""},
      calendarOptions: calendarOptions,
    });
  }


  handleCalendarOptionChange = (optionName, e) => {
    e.preventDefault();
    let currentOptions = this.state.calendarOptions;
    currentOptions[optionName] = e.target.value;
    $(scheduleElementId).fullCalendar("option", currentOptions);
    this.setState({ calendarOptions: currentOptions });
  }

  showCreateModal = eventProps => {
    let actionDetails = { modalTitle: "Add a custom activity", buttonText: "Add", action: this.handleCreateEvent };
    this.handleShowModalWithAction(eventProps, actionDetails);
  }

  showEditModal = eventProps => {
    let actionDetails = { modalTitle: "Edit activity", buttonText: "Save", action: this.handleEditEvent };
    this.handleShowModalWithAction(eventProps, actionDetails);
  }

  handleShowModalWithAction = (eventProps, actionDetails) => {
    this.setState({ showModal: true, eventProps: eventProps, actionDetails: actionDetails }, function() {
      $(window).off("keydown", keyboardHandlers.activityPicker);
    });
  }

  handleHideModal = () => {
    this.setState({ showModal: false, eventProps: {} }, function() {
      $(window).keydown(keyboardHandlers.activityPicker);
    });
  }

  handleCreateEvent = eventData => {
    eventData.startTime = tzConverterHandlers.ambiguousMomentToIsoString(eventData.start);
    eventData.endTime = tzConverterHandlers.ambiguousMomentToIsoString(eventData.end);
    calendarHandlers.addEventToCalendar(eventData);
    this.handleHideModal();
  }

  handleEditEvent = eventData => {
    // CustomActivityModal only edit name, fix the title to enable a simple update
    eventData.title = eventData.name;
    calendarHandlers.eventModifiedInCalendar(eventData);
    $(scheduleElementId).fullCalendar("updateEvent", eventData);
    this.handleHideModal();
  }


  componentWillReceiveProps(newProps) {
    this.setState({ selectedRoom: newProps.selectedRoom });
  }

  generateCalendar = () => {
    let { scheduleWcif, selectedRoom, locale } = this.props;

    let eventFetcher =  (start, end, timezone, callback) => {
      callback(this.getEvents());
    }

    // 'this' is not captured in FC callbacks, to setting up aliases here
    let showModal = eventProps => this.showCreateModal(eventProps);

    $(scheduleElementId).fullCalendar({
      // see: https://fullcalendar.io/docs/views/Custom_Views/
      views: {
        agendaForComp: {
          type: 'agenda',
          duration: { days: scheduleWcif.numberOfDays },
          buttonText: 'Calendar',
        },
      },
      defaultView: 'agendaForComp',
      header: false,
      allDaySlot: false,
      defaultDate: scheduleWcif.startDate,
      locale: locale,
      minTime: calendarOptionsInfo.minTime.defaultValue,
      maxTime: calendarOptionsInfo.maxTime.defaultValue,
      slotDuration: calendarOptionsInfo.slotDuration.defaultValue,
      // Without this, fullcalendar doesn't set the "end" time.
      forceEventDuration: true,
      // Having only one view for edition enable us to have a "static" list of event
      // If we had more, we would need a function to fetch them everytime
      events: eventFetcher,
      editable: true,
      droppable: true,
      dragRevertDuration: 0,
      height: "auto",
      snapDuration: "00:05:00",
      defaultTimedEventDuration: "00:30:00",
      eventDataTransform: activityToFcEvent,
      eventResize: function( event, delta, revertFunc, jsEvent, ui, view ) {
        calendarHandlers.eventModifiedInCalendar(event);
      },
      eventReceive: function(event) {
        // Fix the default duration
        let newEnd = event.start.clone();
        newEnd.add(defaultDurationFromActivityCode(event.activityCode), "m");
        event.end = newEnd;
        // Add the event to the calendar (and to the WCIF schedule, but don't
        // render it as it's already done
        calendarHandlers.addEventToCalendar(fcEventToActivity(event), false);
        if (singleSelectEvent(event)) {
          $(scheduleElementId).fullCalendar("updateEvent", event);
        }
      },
      eventDrop: function( event, delta, revertFunc, jsEvent, ui, view ) {
        calendarHandlers.eventModifiedInCalendar(event);
      },
      eventClick: function(event, jsEvent, view) {
        let $menu = $("#schedule-menu");
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
          $(scheduleElementId).fullCalendar("updateEvent", event);
        }
      },
      eventAfterRender: function(event, element, view) {
        if (event.selected) {
          element.addClass("selected-fc-event");
        }
      },
      eventDragStart: function( event, jsEvent, ui, view ) {
        singleSelectEvent(event);
        $("#schedule-menu").addClass("hide-element");
        $(window).on("mousemove", dragOnMouseMove);
      },
      eventResizeStart: function(event, jsEvent, ui, view) {
        singleSelectEvent(event);
        // We can't rerender or update here, otherwise FC internal state gets messed up
        // So we do a trick: an fc-event able to be resized receive the class 'fc-allow-mouse-resize'
        $(".fc-allow-mouse-resize").addClass("selected-fc-event");
        $("#schedule-menu").addClass("hide-element");
      },
      eventResizeStop: function(event, jsEvent, ui, view) {
        $(scheduleElementId).fullCalendar("updateEvent", event);
      },
      eventDragStop: function( event, jsEvent, ui, view ) {
        $('#drop-event-area').removeClass("event-on-top");
        $(window).off("mousemove", dragOnMouseMove);
        let removed = false;
        if (isEventOverTrash(jsEvent)) {
          removed = calendarHandlers.removeEventFromCalendar(event);
        }
        if (!removed) {
          // Drag stop outside the drop area makes the event render without the selected-fc-event class
          $(scheduleElementId).fullCalendar("updateEvent", event);
        }
      },
      select: function(start, end, jsEvent, view) {
        let eventProps = {
          name: commonActivityCodes["other-registration"],
          activityCode: "other-registration",
          start: start,
          end: end,
        }
        showModal(eventProps);
      },
      selectable: true,
    });
  }

  componentDidMount() {
    this.generateCalendar();
    singleSelectLastEvent(this.props.scheduleWcif, this.state.selectedRoom);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedRoom != this.state.selectedRoom) {
      $(scheduleElementId).fullCalendar("refetchEvents")
      singleSelectLastEvent(this.props.scheduleWcif, this.state.selectedRoom);
    }
  }

  render() {
    let { keyboardEnabled, handleKeyboardChange } = this.props;
    let removeButtonAction = e => {
      calendarHandlers.removeEventFromCalendar($("#schedule-menu").data("event"));
      e.preventDefault();
    }
    let editButtonAction = e => {
      this.showEditModal($("#schedule-menu").data("event"));
      e.preventDefault();
    }

    // FIXME: the menu goes to a separate component
    // FIXME: display the room's timezone somewhere around here!
    return (
      <div id="schedule-editor" className="row">
        <div className="col-xs-2">
          <ButtonToolbar>
            <OverlayTrigger trigger="click"
                            rootClose
                            overlay={<CalendarHelp />}
                            placement="bottom"
            >
              <Button><i className="fa fa-question-circle"></i></Button>
            </OverlayTrigger>
            <OverlayTrigger trigger="click"
                            rootClose
                            placement="bottom"
                            overlay={<CalendarSettings currentSettings={this.state.calendarOptions}
                                                       handlePropChange={this.handleCalendarOptionChange}
                                     />}
            >
              <OverlayTrigger overlay={tooltipSettings} placement="top">
                <Button><i className="fa fa-cog"></i></Button>
              </OverlayTrigger>
            </OverlayTrigger>
            <OverlayTrigger overlay={<TooltipKeyboard enabled={keyboardEnabled}/>} placement="top">
              <Button onClick={handleKeyboardChange} active={keyboardEnabled}>
                <i className="fa fa-keyboard-o"></i>
              </Button>
            </OverlayTrigger>
          </ButtonToolbar>
        </div>
        <div className="col-xs-10">
          <div id="drop-event-area" className="bg-danger text-danger text-center">
            <i className="fa fa-trash pull-left"></i>
            Drop an event here to remove it from the schedule.
            <i className="fa fa-trash pull-right"></i>
          </div>
        </div>
        <div className="col-xs-12" id="schedule-calendar"/>
        <ul id="schedule-menu" className="dropdown-menu hide-element" role="menu">
          <li className="edit-option">
            <a href="#" role="menuitem" onClick={editButtonAction}>
              <i className="fa fa-pencil"></i><span>Edit</span>
            </a>
          </li>
          <li>
            <a href="#" role="menuitem" onClick={removeButtonAction}>
              <i className="fa fa-trash text-danger"></i><span className="text-danger">Remove</span>
            </a>
          </li>
        </ul>
        <CustomActivityModal show={this.state.showModal}
                             eventProps={this.state.eventProps}
                             handleHideModal={this.handleHideModal}
                             actionDetails={this.state.actionDetails}
        />
      </div>
    );
  }
}


class ActivityForAttempt extends React.Component {
  scrollSelectedIntoView = () => {
    if (this.selectedElement) {
      // Check if the selected element is visible
      let container = $("#activity-picker-panel").find(".panel-body");
      let containerHeight = container.height();
      let containerTop = container.offset().top;
      let elemPos = $(this.selectedElement).offset().top;
      let elemHeight = $(this.selectedElement).height();
      let scrollPos = $(window).scrollTop();
      let visibleHeight = $(window).height();
      if (elemPos < containerTop || elemPos > (containerTop + containerHeight)
          || elemPos > (scrollPos + visibleHeight) || elemPos < (scrollPos - elemHeight)) {
        // then element is not visible, scroll into it
        this.selectedElement.scrollIntoView();
      }
    }
  }

  componentDidMount() {
    this.scrollSelectedIntoView();
  }

  componentDidUpdate() {
    this.scrollSelectedIntoView();
  }

  render() {
    let { usedActivityCodeList, activityCode, attemptNumber, selected } = this.props;
    let { roundNumber } = parseActivityCode(activityCode);
    let tooltipText = roundIdToString(activityCode);
    let text = `R${roundNumber}`;
    if (attemptNumber) {
      tooltipText += `, Attempt ${attemptNumber}`;
      text += `A${attemptNumber}`;
      activityCode += `-a${attemptNumber}`;
    }

    let tooltip = (
      <Tooltip id={`tooltip-${activityCode}`}>
        {tooltipText}
      </Tooltip>
    );
    let outerCssClasses = [
      "activity-in-picker",
      { "col-xs-6 col-md-4 col-lg-3" : !attemptNumber},
      { "col-xs-12 col-md-6 col-lg-4" : attemptNumber},
    ]
    let innerCssClasses = [
      "activity",
      {"activity-used": (usedActivityCodeList.indexOf(activityCode) > -1)},
      { "selected-activity" : selected},
    ]

    let refFunction = (elem) => {
      if (selected) {
        this.selectedElement = elem;
      }
    }
    return (
      <div className={cn(outerCssClasses)} data-activity-code={activityCode}>
        <OverlayTrigger placement="top" overlay={tooltip}>
          <div className={cn(innerCssClasses)}
               ref={refFunction}
               data-event={`{"name": "${tooltipText}", "activityCode": "${activityCode}"}`}>
            {text}
          </div>
        </OverlayTrigger>
      </div>
    );
  }
}

function ActivitiesForRound({ usedActivityCodeList, round, selectedLine, selectedX, indexInRow }) {
  let activityCode = round.id;
  let { eventId } = parseActivityCode(activityCode);

  let attempts = [];
  if (eventId == "333fm" || eventId == "333mbf") {
    let numberOfAttempts = formats.byId[round.format].expectedSolveCount;
    for (let i = 0; i < numberOfAttempts; i++) {
      attempts.push(<ActivityForAttempt activityCode={activityCode}
                                        usedActivityCodeList={usedActivityCodeList}
                                        key={i}
                                        attemptNumber={i+1}
                                        selected={selectedLine && selectedX == i}
      />);
    }
    attempts.push(<div key={numberOfAttempts} className="clearfix" />);
  } else {
    attempts.push(<ActivityForAttempt key="0" usedActivityCodeList={usedActivityCodeList}
                                              activityCode={activityCode}
                                              selected={selectedLine && selectedX == indexInRow}
                                              attemptNumber={null}
                  />);
  }
  return (
    <div>
      {attempts}
    </div>
  );
}

function ActivityPickerLine({ eventWcif, usedActivityCodeList, selectedLine, selectedX }) {
  let event = events.byId[eventWcif.id];

  return (
    <div className="col-xs-12 event-picker-line">
      <div className="row">
        <div className="col-xs-12 col-md-3 col-lg-2 activity-icon">
          <span className={cn("cubing-icon", `event-${event.id}`)}></span>
        </div>
        <div className="col-xs-12 col-md-9 col-lg-10">
          <div className="row">
            {eventWcif.rounds.map((value, index) => {
              let activities = (
                <ActivitiesForRound key={value.id}
                                    indexInRow={index}
                                    round={value}
                                    usedActivityCodeList={usedActivityCodeList}
                                    selectedLine={selectedLine}
                                    selectedX={selectedX}
                />
              );
              if (event.id == "333mbf" || event.id == "333fm") {
                // For these events the selectedX spreads accross multiple rounds.
                // This corrects the offset.
                selectedX -= formats.byId[value.format].expectedSolveCount;
              }
              return activities;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const trySetSelectedEvent = direction => {
  let currentEventSelected = selectedEventInCalendar();
  if (!currentEventSelected) {
    return;
  }
  let allEvents = _.sortBy($(scheduleElementId).fullCalendar("clientEvents"), ["start", "end"]);
  // groupBy preserve sorting
  let allGroupedEvents = _.groupBy(allEvents, function(value) { return value.start.day(); });
  if (direction == "up" || direction == "down") {
    //function singleSelectEvent(event);
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
    $(scheduleElementId).fullCalendar("updateEvent", currentEventSelected)
  }
}

const activityPickerElementId = "activity-picker-panel";

const keyboardHandlers = {
};

class ActivityPicker extends React.Component {
  constructor(props) {
    super(props);
    keyboardHandlers.activityPicker = e => this.keyboardHandler(e, this);
  }

  keyboardHandler = (event, reactElem) => {
    let startDate = $.fullCalendar.moment(reactElem.props.scheduleWcif.startDate);
    let firstDayAfterCompetition = startDate.clone();
    firstDayAfterCompetition.add(reactElem.props.scheduleWcif.numberOfDays + 1, "d");

    // Only handle if the edit panel if not collapse
    if ($("#schedules-edit-panel-body")[0].offsetParent === null) {
      return true;
    }
    if (!reactElem.props.keyboardEnabled) {
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
              calendarHandlers.eventModifiedInCalendar(currentEventSelected);
              $(scheduleElementId).fullCalendar("updateEvent", currentEventSelected);
            }
          }
        } else if (event.shiftKey) {
          reactElem.trySetSelectedActivity("left");
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
            calendarHandlers.eventModifiedInCalendar(currentEventSelected);
            $(scheduleElementId).fullCalendar("updateEvent", currentEventSelected);
          }
        } else {
          if (event.shiftKey) {
            reactElem.trySetSelectedActivity("down");
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
            calendarHandlers.eventModifiedInCalendar(currentEventSelected);
            $(scheduleElementId).fullCalendar("updateEvent", currentEventSelected);
          }
        } else {
          if (event.shiftKey) {
            reactElem.trySetSelectedActivity("up");
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
              calendarHandlers.eventModifiedInCalendar(currentEventSelected);
              $(scheduleElementId).fullCalendar("updateEvent", currentEventSelected);
            }
          }
        } else if (event.shiftKey) {
          reactElem.trySetSelectedActivity("right");
        } else {
          trySetSelectedEvent("right");
        }
        break;
      // enter
      case 13:
        let $elemSelected = $(".selected-activity");
        if ($elemSelected.size() == 1) {
          calendarHandlers.addEventToCalendar($elemSelected.data("event"));
        }
      break;
      // del
      case 46:
        if (currentEventSelected) {
          calendarHandlers.removeEventFromCalendar(currentEventSelected);
        }
      break;
      default:
        return true;
        break;
    }
    return false;
  }

  trySetSelectedActivity = (direction, ignoreKeyboard = false) => {
    let { eventsWcif, keyboardEnabled } = this.props;
    if ((!keyboardEnabled && !ignoreKeyboard) || eventsWcif.length == 0) {
      return;
    }
    let x = this.state.selectedX;
    let y = this.state.selectedY;
    switch (direction) {
      case "up":
        y--;
      break;
      case "down":
        y++;
      break;
      case "left":
        x--;
      break;
      case "right":
        x++;
      break;
      default:
        return;
    }
    let fixedY = Math.max(0, Math.min(y, eventsWcif.length - 1));
    let fixedX = 0;
    // Loop at most through all rows, starting from selected, hoping to find one with rounds
    // Else we just default to 0,0 and nothing will be selected
    for (let i = 0; i < eventsWcif.length; i++) {
      let eventRow = eventsWcif[fixedY];
      let eventRowLength = 0;
      let eventId = eventRow.id;
      eventRow.rounds.forEach(function(round) {
        if (eventId == "333fm" || eventId == "333mbf") {
          eventRowLength += formats.byId[round.format].expectedSolveCount;
        } else {
          eventRowLength++;
        }
      });
      if (eventRowLength != 0) {
        fixedX = Math.max(0, Math.min(x, eventRowLength - 1));
        break;
      }
      if (direction == "up") {
        fixedY--;
        if (fixedY < 0) {
          return;
        }
      } else if (direction == "down") {
        fixedY++;
        if (fixedY >= eventsWcif.length) {
          return;
        }
      }
    }
    this.setState({
      selectedY: fixedY,
      selectedX: fixedX,
    });
  }

  adjustPickerDimension = () => {
    let $pickerElem = $(`#${activityPickerElementId}`);
    let $panelElem = $("#schedules-edit-panel");
    let visibleAvailable = $panelElem.offset().top + $panelElem.outerHeight() - $(window).scrollTop();
    // 15 is margin bottom we want to keep
    let headerHeight = $pickerElem.find(".panel-heading").outerHeight();
    let topPos = 10 + headerHeight;
    let visibleAvailableForBody = visibleAvailable - topPos - 15;
    let $bodyElem = $pickerElem.find(".panel-body");
    $bodyElem.css("height", visibleAvailableForBody);
  }

  // FIXME: these probably belongs to the parent component
  // or at least the parent should be responsible to provide the parent identifier (schedules-edit-panel)
  computeBasePickerDimension = () => {
    let $pickerElem = $(`#${activityPickerElementId}`);
    // Dynamically fix the width
    $pickerElem.width($pickerElem.parent().width());

    // Dynamically set the max height for the picker panel body
    let $bodyElem = $pickerElem.find(".panel-body");
    // 10 is margin top we want to keep
    let headerHeight = $pickerElem.find(".panel-heading").outerHeight();
    let topPos = 10 + headerHeight;
    let maxPossibleHeight = $(window).height() - topPos - 15;
    $bodyElem.css("max-height", maxPossibleHeight);
  };


  componentWillMount() {
    this.setState({
      // event's row selected (from top to bottom)
      // init to -1, as we are going to force the select of the first down
      selectedY: -1,
      // event's round or attempt selected (from left to right)
      selectedX: 0,
    }, () => this.trySetSelectedActivity("down", true));
  }

  componentDidMount() {
    let $pickerElem = $(`#${activityPickerElementId}`);
    let $panelElem = $("#schedules-edit-panel");


    let computeAffixedPickerDimension = () => {
        this.computeBasePickerDimension();
        this.adjustPickerDimension();
        let $panelElemHeight = $panelElem.height();
        $panelElem.css("min-height", $panelElemHeight);
    };

    let resetPanelDimension = () => {
      $panelElem.css("min-height", 0);
    };

    $pickerElem.affix({
      offset: {
        top: function () {
          // Dynamically compute the offset trigger, as we're in a collapsible element
          return $pickerElem.parent().offset().top + 10;
        },
      },
    });
    $pickerElem.on('affix.bs.affix', computeAffixedPickerDimension);
    $pickerElem.on('affix-top.bs.affix', resetPanelDimension);
    $(window).scroll(this.adjustPickerDimension);
    $(window).resize(this.computeBasePickerDimension);
    // FIXME this belongs to the whole schedules editor
    $(window).keydown(keyboardHandlers.activityPicker);
  }

  componentWillUnmount() {
    $(window).off("keydown", keyboardHandlers.activityPicker);
    $(window).off("resize", this.computeBasePickerDimension);
    $(window).off("scroll", this.adjustPickerDimension);
  }

  render() {
    let { scheduleWcif, eventsWcif, usedActivityCodeList, keyboardEnabled } = this.props;
    let { selectedX, selectedY } = this.state;
    if (!keyboardEnabled) {
      selectedX = -1;
      selectedY = -1;
    }
    return (
      <Panel id="activity-picker-panel">
        <Panel.Heading>
          Activity picker
        </Panel.Heading>
        <Panel.Body>
          {eventsWcif.map((value, index) => {
            return (
              <ActivityPickerLine key={value.id} selectedLine={index == selectedY} eventWcif={value} usedActivityCodeList={usedActivityCodeList} selectedX={selectedX} />
            );
          })}
          <div className="col-xs-12">
            <p>
              Want to add a custom activity such as lunch or registration?
              Click and select a timeframe on the calendar!
            </p>
          </div>
        </Panel.Body>
      </Panel>
    );
  }
}

export class SchedulesEditor extends React.Component {
  constructor(props) {
    super(props);
    let toggleHandler = this.handleToggleKeyboardEnabled;
    $(window).keydown(function(event) {
      // ctrl + i
      if (event.ctrlKey && !event.shiftKey && event.which == 73) {
        toggleHandler();
      }
    });
    calendarHandlers.addEventToCalendar = this.addActivityToSchedule;
    calendarHandlers.removeEventFromCalendar = this.removeActivityFromSchedule;
    calendarHandlers.eventModifiedInCalendar = this.handleEventModified;
    tzConverterHandlers.isoStringToAmbiguousMoment = s => this.isoStringToAmbiguousMoment(this, s);
    tzConverterHandlers.ambiguousMomentToIsoString = m => this.ambiguousMomentToIsoString(this, m);
    $(window).click(function(event) {
      let $menu = $("#schedule-menu");
      if (!$menu.hasClass("hide-element")) {
        $menu.removeClass("delete-only");
        $menu.addClass("hide-element");
      }
    });
  }

  isoStringToAmbiguousMoment = (editor, isoString) => {
    let scheduleWcif = editor.props.scheduleWcif;
    let venue = venueWcifFromRoomId(scheduleWcif, editor.state.selectedRoom);
    let tz = venue.timezone;
    // Using FC's moment because it has a custom "stripZone" feature
    // The final FC display will be timezone-free, and the user expect a calendar
    // in the venue's TZ.
    // First convert the time received into the venue's timezone, then strip its value
    let ret = $.fullCalendar.moment(isoString).tz(tz).stripZone();
    return ret;
  }

  ambiguousMomentToIsoString = (editor, momentObject) => {
    let scheduleWcif = editor.props.scheduleWcif;
    let venue = venueWcifFromRoomId(scheduleWcif, editor.state.selectedRoom);
    let tz = venue.timezone;
    // Take the moment and "concatenate" the UTC offset of the timezone at that time
    // momentObject is a FC (ambiguously zoned) moment, therefore format() returns a zone free string
    let ret = moment.tz(momentObject.format(), tz).format();
    return ret;
  }

  componentWillMount() {
    let { scheduleWcif } = this.props;
    this.setState({
      selectedRoom: "",
      usedActivityCodeList: activityCodeListFromWcif(scheduleWcif),
      keyboardEnabled: false,
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!roomWcifFromId(nextProps.scheduleWcif, this.state.selectedRoom)) {
      this.setState({ selectedRoom: "" });
    }
    this.setState({ usedActivityCodeList: activityCodeListFromWcif(nextProps.scheduleWcif) });
  }

  handleToggleKeyboardEnabled = () => {
    this.setState({ keyboardEnabled: !this.state.keyboardEnabled });
  }

  handleRoomChange = e => {
    this.setState({ selectedRoom: e.target.value });
  }

  removeActivityFromSchedule = event => {

    if (!confirm(`Are you sure you want to remove ${event.name}`)) {
      return false;
    }

    // Remove activityCode from the list used by the ActivityPicker
    let newActivityCodeList = this.state.usedActivityCodeList;
    let activityCodeIndex = newActivityCodeList.indexOf(event.activityCode);
    if (activityCodeIndex < 0) {
      alert("This is BAD, I couldn't find an activity code when removing event!");
    }
    newActivityCodeList.splice(activityCodeIndex, 1);
    // Remove activity from the list used by the ActivityPicker
    let { scheduleWcif } = this.props;
    let room = roomWcifFromId(scheduleWcif, this.state.selectedRoom);
    let activityIndex = activityIndexInArray(room.activities, event.id);
    if (activityIndex < 0) {
      alert("This is very very BAD, I couldn't find an activity matching the removed event!");
    }
    room.activities.splice(activityIndex, 1);
    // We rootRender to display the "Please save your changes..." message
    this.setState({ usedActivityCodeList: newActivityCodeList }, rootRender());

    $(scheduleElementId).fullCalendar('removeEvents', event.id);
    singleSelectLastEvent(scheduleWcif, this.state.selectedRoom);
    return true;
  }

  handleEventModified = event => {
    let { scheduleWcif } = this.props;
    let room = roomWcifFromId(scheduleWcif, this.state.selectedRoom);
    let activityIndex = activityIndexInArray(room.activities, event.id);
    if (activityIndex < 0) {
      alert("This is very very BAD, I couldn't find an activity matching the modified event!");
    }
    let activity = room.activities[activityIndex];
    activity.name = event.name;
    activity.activityCode = event.activityCode;
    activity.startTime = tzConverterHandlers.ambiguousMomentToIsoString(event.start);
    activity.endTime = tzConverterHandlers.ambiguousMomentToIsoString(event.end);
    // We rootRender to display the "Please save your changes..." message
    rootRender();
  }

  addActivityToSchedule = (activityData, renderItOnCalendar=true) => {
    let currentEventSelected = selectedEventInCalendar();
    let roomSelected = roomWcifFromId(this.props.scheduleWcif, this.state.selectedRoom);
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
        newActivity.startTime = tzConverterHandlers.ambiguousMomentToIsoString(newStart);
        let newEnd = newStart.add(defaultDurationFromActivityCode(newActivity.activityCode), "m");
        newActivity.endTime = tzConverterHandlers.ambiguousMomentToIsoString(newEnd);
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
        $(scheduleElementId).fullCalendar("renderEvent", fcEvent);
      }
      // update list of activityCode used, and rootRender to display the save message
      this.setState({ usedActivityCodeList: [...this.state.usedActivityCodeList, newActivity.activityCode] }, rootRender());
    }
  }

  componentDidMount() {
    $(".activity-in-picker > .activity").draggable({
      start: function(event, ui) {
        $(ui.helper).find('.tooltip').hide();
      },
      revert: false,
      helper: "clone",
      // To get out of the overflow container
      appendTo: "body",
      cursor: "copy",
      cursorAt: { top: 20, left: 10 }
    });
    $(".activity-in-picker > .activity").click(e => calendarHandlers.addEventToCalendar($(e.target).data("event")));
  }

  render() {
    let { scheduleWcif, eventsWcif, locale } = this.props;
    let rightPanelBody = <NoRoomSelected />;

    if (this.state.selectedRoom.length > 0) {
      rightPanelBody = (
        <EditScheduleForRoom scheduleWcif={scheduleWcif}
                             locale={locale}
                             keyboardEnabled={this.state.keyboardEnabled}
                             handleKeyboardChange={this.handleToggleKeyboardEnabled}
                             selectedRoom={this.state.selectedRoom}
        />);
    }

    return (
      <div className="row">
        <div className="col-xs-3">
          <ActivityPicker scheduleWcif={scheduleWcif} eventsWcif={eventsWcif} usedActivityCodeList={this.state.usedActivityCodeList} keyboardEnabled={this.state.keyboardEnabled} />
        </div>
        <div className="col-xs-9">
          <Panel>
            <Panel.Heading>
              <RoomSelector scheduleWcif={scheduleWcif} selectedRoom={this.state.selectedRoom} handleRoomChange={this.handleRoomChange} />
            </Panel.Heading>
            <Panel.Body>
              {rightPanelBody}
            </Panel.Body>
          </Panel>
        </div>
      </div>
    );
  }
}
