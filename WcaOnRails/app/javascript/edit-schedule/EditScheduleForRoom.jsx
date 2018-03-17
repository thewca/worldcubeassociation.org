import React from 'react'
import cn from 'classnames'
import events from 'wca/events.js.erb'
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

function activityToFcEvent(eventData) {
  if (eventData.hasOwnProperty("name")) {
    eventData.title = eventData.name;
  }

  // Generate a new activity id if needed
  if (!eventData.hasOwnProperty("id")) {
    eventData.id = newActivityId();
  }
  // Keep activityCode
  if (eventData.hasOwnProperty("startTime")) {
    eventData.start = $.fullCalendar.moment(eventData.startTime);
  }
  if (eventData.hasOwnProperty("endTime")) {
    eventData.end = $.fullCalendar.moment(eventData.endTime);
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
    activity.startTime = event.start.format();
  }
  if (event.hasOwnProperty("end")) {
    activity.endTime = event.end.format();
  }
  if (event.hasOwnProperty("childActivities")) {
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
        <div className="col-xs-8">
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

const commonActivityCodes = {
  "other-registration": "Registration",
  "other-breakfast": "Breakfast",
  "other-lunch": "Lunch",
  "other-dinner": "Dinner",
  "other-awards": "Awards",
  "other-misc": "Other",
};

class AddCustomActivityModal extends React.Component {
  // FIXME: extract to standalone file

  componentWillReceiveProps(newProps) {
    if (!this.props.show && newProps.show) {
      // FIXME: DRY with below
      this.setState({
        name: "Your activity Name",
        activityCode: "other-registration",
      });
    }
  }

  componentWillMount() {
    this.setState({
      name: "Your activity Name",
      activityCode: "other-registration",
    });
  }

  render () {
    let { show, handleHideModal, handleCreateEvent, selectedTime } = this.props;
    let timeText = "No time selected";
    if (selectedTime.start && selectedTime.end) {
      timeText = `On ${selectedTime.start.format("dddd, MMMM Do YYYY")}, from ${selectedTime.start.format("H:mm")} to ${selectedTime.end.format("H:mm")}.`;
    }

    let handlePropChange = (propName, e) => {
      let newState = {};
      newState[propName] = e.target.value;
      this.setState(newState);
    };

    return (
      <Modal show={show} onHide={handleHideModal} container={this}>
        <Modal.Header closeButton>
        <Modal.Title>Add a custom activity</Modal.Title>
        </Modal.Header>
        <Modal.Body className="form-horizontal row">
          <div className="form-group">
            <div className="control-label col-xs-3">
              <label>Name</label>
            </div>
            <div className="col-xs-8">
              <input className="form-control" type="text" id="activity_name" value={this.state.name} onChange={e => handlePropChange("name", e)}/>
            </div>
          </div>
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
            <div className="col-xs-10 col-xs-offset-2">
              {timeText}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => handleCreateEvent(this.state)} bsStyle="success">Add event</Button>
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
  for (var i = 0; i < 24; i++) {
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
      selectedTime: {},
      calendarOptions: calendarOptions,
    });
  }

  handleCalendarOptionChange = (optionName, e) => {
    e.preventDefault();
    let currentOptions = this.state.calendarOptions;
    // FIXME: check minTime/maxTime is coherent
    currentOptions[optionName] = e.target.value;
    $(scheduleElementId).fullCalendar("option", currentOptions);
    this.setState({ calendarOptions: currentOptions });
  }

  handleShowModal = (start, end) => {
    this.setState({ showModal: true, selectedTime: { start: start, end: end } });
  }

  handleHideModal = () => {
    this.setState({ showModal: false, selectedTime: {} });
  }

  handleCreateEvent = (eventData) => {
    let { calendarHandlers } = this.props;
    let fcEvent = {
      title: eventData.name,
      activityCode: eventData.activityCode,
      start: this.state.selectedTime.start,
      end: this.state.selectedTime.end,
      id: newActivityId(),
    };
    calendarHandlers.eventAddedToCalendar(fcEvent);
    $(scheduleElementId).fullCalendar("renderEvent", fcEvent);
    this.handleHideModal();
  }


  componentWillReceiveProps(newProps) {
    this.setState({ selectedRoom: newProps.selectedRoom });
  }

  generateCalendar = () => {
    let { scheduleWcif, selectedRoom, calendarHandlers, locale } = this.props;

    let eventFetcher =  (start, end, timezone, callback) => {
      callback(this.getEvents());
    }

    let showModal = (start, end) => this.handleShowModal(start, end);

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
      eventDragStart: function( event, jsEvent, ui, view ) {
        console.log(jsEvent);
      },
      eventDragStop: function( event, jsEvent, ui, view ) {
        if (isEventOverTrash(jsEvent)) {
          calendarHandlers.eventRemovedFromCalendar(event);
          $(scheduleElementId).fullCalendar('removeEvents', event.id);
        }
      },
      select: function(start, end, jsEvent, view) {
        showModal(start, end);
      },
      selectable: true,
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
        <div className="col-xs-2">
          <ButtonToolbar>
            <OverlayTrigger trigger="click"
                            rootClose
                            placement="bottom"
                            overlay={<CalendarSettings currentSettings={this.state.calendarOptions}
                                                       handlePropChange={this.handleCalendarOptionChange}
                                     />}
            >
              <Button><i className="fa fa-cog"></i></Button>
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
        <AddCustomActivityModal show={this.state.showModal}
                                selectedTime={this.state.selectedTime}
                                handleHideModal={this.handleHideModal}
                                handleCreateEvent={this.handleCreateEvent}
        />
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
    // We rootRender to display the "Please save your changes..." message
    this.setState({ usedActivityCodeList: [...this.state.usedActivityCodeList, event.activityCode] }, rootRender());
  }

  handleEventRemoved = event => {

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
  }

  handleEventModified = event => {
    let { scheduleWcif } = this.props;
    let room = roomWcifFromId(scheduleWcif, this.state.selectedRoom);
    let activityIndex = activityIndexInArray(room.activities, event.id);
    if (activityIndex < 0) {
      alert("This is very very BAD, I couldn't find an activity matching the modified event!");
    }
    let activity = room.activities[activityIndex];
    activity.startTime = event.start.format();
    activity.endTime = event.end.format();
    // We rootRender to display the "Please save your changes..." message
    rootRender();
  }


  componentDidMount() {
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
    let { scheduleWcif, eventsWcif, locale } = this.props;
    let rightPanelBody = <NoRoomSelected />;
    let calendarHandlers = {
      eventAddedToCalendar: this.handleEventAdded,
      eventRemovedFromCalendar: this.handleEventRemoved,
      eventModifiedInCalendar: this.handleEventModified,
    };

    if (this.state.selectedRoom.length > 0) {
      rightPanelBody = (
        <EditScheduleForRoom scheduleWcif={scheduleWcif}
                             locale={locale}
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
