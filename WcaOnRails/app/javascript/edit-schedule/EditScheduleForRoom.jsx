import React from 'react'
import cn from 'classnames'
import events from 'wca/events.js.erb'
import _ from 'lodash'
import ReactDOM from 'react-dom'
import { parseActivityCode, roundIdToString } from 'edit-events/modals/utils'
import { Panel, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { rootRender } from 'edit-schedule'
import { newActivityId } from './EditSchedule'

function NoRoomSelected() {
  return (
    <div>Please select a room to edit its schedule</div>
  );
}

function activityToFcEvent(eventData) {
  // Here we assume "eventData" is an object with at least name/activityCode
  eventData.title = eventData.name;

  // Generate a new activity id if needed
  if (!eventData.hasOwnProperty("id")) {
    eventData.id = newActivityId();
  }
  // Keep activityCode
  if (eventData.startTime) {
    eventData.start = $.fullCalendar.moment(eventData.startTime);
  }
  if (eventData.endTime) {
    eventData.end = $.fullCalendar.moment(eventData.endTime);
  }
  return eventData;
};

function fcEventToActivity(event) {
  let activity = {
    name: event.title,
    activityCode: event.activityCode,
  };
  // If activity had an id (ie existed in the WCIF), then it's kept by FC
  // If not, FC maintains an internal '_id' attribute, but does not set 'id'
  if (event.id) {
    activity.id = event.id;
  }
  if (event.start) {
    activity.startTime = event.start.format();
  }
  if (event.end) {
    activity.endTime = event.end.format();
  }
  if (event.childActivities) {
    // Not modified by FC, put them back anyway
    activity.childActivities = event.childActivities;
  }
  return activity;
}

function roomWcifFromId(scheduleWcif, id) {
  if (id.length > 0) {
    for (var i = 0; i < scheduleWcif.venues.length; i++) {
      let venue = scheduleWcif.venues[i];
      for (var j = 0; j < venue.rooms.length; j++) {
        let room = venue.rooms[j];
        if (id == room.id) {
          return room;
        }
      }
    }
  }
  return null;
}

function activityIndexInArray(activities, id) {
  for (var i = 0; i < activities.length; i++) {
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
    <div className="form-horizontal row">
        <label htmlFor="venue-room-selector" className="control-label col-xs-3">
          Select a room to edit its schedule:
        </label>
        <div className="col-xs-9">
          <select id="venue-room-selector" className="form-control input-sm" onChange={handleRoomChange} value={selectedRoom}>
            {options}
          </select>
        </div>
    </div>
  );
}


var isEventOverTrash = function(jsEvent) {
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

class EditScheduleForRoom extends React.Component {

  getEvents = () => {
    return roomWcifFromId(this.props.scheduleWcif, this.state.selectedRoom).activities
  }

  componentWillMount() {
    this.setState({ selectedRoom: this.props.selectedRoom });
  }

  componentWillReceiveProps(newProps) {
    this.setState({ selectedRoom: newProps.selectedRoom });
  }

  generateCalendar = () => {
    let { scheduleWcif, selectedRoom, calendarHandlers } = this.props;

    let eventFetcher =  (start, end, timezone, callback) => {
      callback(this.getEvents());
    }


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
      // FIXME: extract propriety
      minTime:'08:00:00',
      maxTime:'22:00:00',
      //aspectRatio: '3',
      // FIXME: toggle duration
      slotDuration: '00:30:00',
      // Without this, fullcalendar doesn't set the "end" time.
      forceEventDuration: true,
      timeFormat: 'H:mm',
      slotLabelFormat: 'H:mm',
      // Having only one view for edition enable us to have a "static" list of event
      // If we had more, we would need a function to fetch them everytime
      events: eventFetcher,
      editable: true,
      droppable: true,
      eventDataTransform: activityToFcEvent,
      eventResize: function( event, delta, revertFunc, jsEvent, ui, view ) {
        calendarHandlers.eventModifiedInCalendar(event);
      },
      eventReceive: function(event) {
        calendarHandlers.eventAddedToCalendar(event);
      },
      eventDrop: function( event, delta, revertFunc, jsEvent, ui, view ) {
        calendarHandlers.eventModifiedInCalendar(event);
      },
      eventDragStop: function( event, jsEvent, ui, view ) {
        if (isEventOverTrash(jsEvent)) {
          $(scheduleElementId).fullCalendar('removeEvents', event.id);
          calendarHandlers.eventRemovedFromCalendar(event);
        }
      },
      selectable: false,
      // TODO: onclick, display format, cutoff, etcc
    });
  }

  componentDidMount() {
    this.generateCalendar();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedRoom != this.state.selectedRoom) {
      $(scheduleElementId).fullCalendar("refetchEvents")
    }
  }

  render() {
    return (
      <div id="schedule-editor" className="row">
        <div className="col-xs-12">
          <div id="drop-event-area" className="bg-danger text-danger text-center">
            <i className="fa fa-trash pull-left"></i>
            Drop an event here to remove it from the schedule.
            <i className="fa fa-trash pull-right"></i>
          </div>
        </div>
        <div className="col-xs-12" id="schedule-calendar"/>
      </div>
    );
  }
}


function ActivityForAttempt({ usedActivityCodeList, activityCode, attemptNumber }) {
  let { roundNumber } = parseActivityCode(activityCode);
  let tooltipText = roundIdToString(activityCode);
  let text = `R${roundNumber}`;
  if (attemptNumber) {
    tooltipText += `, Attempt ${attemptNumber}`;
    text += `A${attemptNumber}`;
    activityCode += `a-${attemptNumber}`;
  }

  let tooltip = (
    <Tooltip id={`tooltip-${activityCode}`}>
      {tooltipText}
    </Tooltip>
  );
  return (
    <div className="col-xs-3 activity-in-picker" data-activity-code={activityCode}>
      <OverlayTrigger placement="top" overlay={tooltip}>
        <div className={cn("activity", {"activity-used": (usedActivityCodeList.indexOf(activityCode) > -1)})}
             data-event={`{"name": "${tooltipText}", "activityCode": "${activityCode}"}`}>
          {text}
        </div>
      </OverlayTrigger>
    </div>
  );
}

function ActivitiesForRound({ usedActivityCodeList, activityCode, format }) {
  let { eventId } = parseActivityCode(activityCode);

  let attempts = [];
  if (eventId == "333fm" || eventId == "333mbf") {
    switch (format) {
      case "m":
      case "3":
        attempts.unshift(<ActivityForAttempt activityCode={activityCode}
                                             usedActivityCodeList={usedActivityCodeList}
                                             key="3" attemptNumber={3}
        />);
        // intentional no-break
      case "2":
        attempts.unshift(<ActivityForAttempt activityCode={activityCode}
                                             usedActivityCodeList={usedActivityCodeList}
                                             key="2" attemptNumber={2}
        />);
        // intentional no-break
      case "1":
        attempts.unshift(<ActivityForAttempt activityCode={activityCode}
                                             usedActivityCodeList={usedActivityCodeList}
                                             key="1" attemptNumber={1}
        />);
        // intentional no-break
      break;
      default:
      break;
    }
    attempts.push(<div key="0" className="clearfix" />);
  } else {
    attempts.push(<ActivityForAttempt key="0" usedActivityCodeList={usedActivityCodeList}
                                              activityCode={activityCode}
                                              attemptNumber={null}
                  />);
  }
  return (
    <div>
      {attempts}
    </div>
  );
}

function ActivityPickerLine({ eventWcif, usedActivityCodeList }) {
  let event = events.byId[eventWcif.id];

  return (
    <div className="col-xs-12 event-picker-line">
      <div className="row">
        <div className="col-xs-2">
          <span className={cn("cubing-icon", `event-${event.id}`)}></span>
        </div>
        <div className="col-xs-10">
          <div className="row">
            {eventWcif.rounds.map((value, index) => {
              return (
                <ActivitiesForRound key={value.id}
                                    activityCode={value.id}
                                    usedActivityCodeList={usedActivityCodeList}
                                    format={value.format}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

class ActivityPicker extends React.Component {
  //FIXME: to function, state maintained by parent
  render() {
    let { scheduleWcif, eventsWcif, usedActivityCodeList } = this.props;
    return (
      <Panel id="activity-picker-panel">
        <Panel.Heading>
          Activity picker
        </Panel.Heading>
        <Panel.Body>
          {eventsWcif.map((value, index) => {
            return (
              <ActivityPickerLine key={value.id} eventWcif={value} usedActivityCodeList={usedActivityCodeList} />
            );
          })}
        </Panel.Body>
      </Panel>
    );
  }
}

export class SchedulesEditor extends React.Component {

  componentWillMount() {
    let { scheduleWcif } = this.props;
    this.setState({ selectedRoom: "", usedActivityCodeList: activityCodeListFromWcif(scheduleWcif) });
  }

  componentWillReceiveProps(nextProps) {
    if (!roomWcifFromId(nextProps.scheduleWcif, this.state.selectedRoom)) {
      this.setState({ selectedRoom: "" });
    }
    this.setState({ usedActivityCodeList: activityCodeListFromWcif(nextProps.scheduleWcif) });
  }

  handleRoomChange = e => {
    this.setState({ selectedRoom: e.target.value });
  }

  handleEventAdded = event => {
    let { scheduleWcif } = this.props;
    let room = roomWcifFromId(scheduleWcif, this.state.selectedRoom);
    // Add activity to the WCIF
    room.activities.push(fcEventToActivity(event))
    // Update the list of activityCode used
    this.setState({ usedActivityCodeList: [...this.state.usedActivityCodeList, event.activityCode] });
  }

  handleEventRemoved = event => {

    // Remove activityCode from the list used by the ActivityPicker
    let newActivityCodeList = this.state.usedActivityCodeList;
    let activityCodeIndex = newActivityCodeList.indexOf(event.activityCode);
    if (activityCodeIndex < 0) {
      alert("This id BAD, I couldn't find an activity code when removing event!");
    }
    newActivityCodeList.splice(activityCodeIndex, 1);
    this.setState({ usedActivityCodeList: newActivityCodeList });

    // Remove activity from the list used by the ActivityPicker
    let { scheduleWcif } = this.props;
    let room = roomWcifFromId(scheduleWcif, this.state.selectedRoom);
    let activityIndex = activityIndexInArray(room.activities, event.id);
    if (activityIndex < 0) {
      alert("This id very very BAD, I couldn't find an activity matching the removed event!");
    }
    room.activities.splice(activityIndex, 1);
  }

  handleEventModified = event => {
    let { scheduleWcif } = this.props;
    let room = roomWcifFromId(scheduleWcif, this.state.selectedRoom);
    let activityIndex = activityIndexInArray(room.activities, event.id);
    if (activityIndex < 0) {
      alert("This id very very BAD, I couldn't find an activity matching the modified event!");
    }
    let activity = room.activities[activityIndex];
    activity.startTime = event.start.format();
    activity.endTime = event.end.format();
  }


  componentDidMount() {
    this.props.enableDraggableAction();
    $(".activity-in-picker > .activity").draggable({
      start: function(event, ui) {
        $(ui.helper).find('.tooltip').hide();
      },
      revert: false,
      helper: "clone",
      cursor: "copy",
      cursorAt: { top: 20, left: 10 }
    });
  }

  render() {
    let { scheduleWcif, eventsWcif } = this.props;
    let rightPanelBody = <NoRoomSelected />;
    let calendarHandlers = {
      eventAddedToCalendar: this.handleEventAdded,
      eventRemovedFromCalendar: this.handleEventRemoved,
      eventModifiedInCalendar: this.handleEventModified,
    };

    if (this.state.selectedRoom.length > 0) {
      rightPanelBody = (
        <EditScheduleForRoom scheduleWcif={scheduleWcif}
                             selectedRoom={this.state.selectedRoom}
                             calendarHandlers={calendarHandlers}
        />);
    }

    return (
      <div className="row">
        <div className="col-xs-3">
          <ActivityPicker scheduleWcif={scheduleWcif} eventsWcif={eventsWcif} usedActivityCodeList={this.state.usedActivityCodeList} />
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
