import React from 'react'
import _ from 'lodash'
import {
  Col,
  Panel,
  Row,
} from 'react-bootstrap'

import {
  activityCodeListFromWcif,
  roomWcifFromId,
  venueWcifFromRoomId,
} from 'wca/wcif-utils'
import {
  addActivityToCalendar,
  removeEventFromCalendar,
  setupCalendarHandlers,
  setupConvertHandlers,
  singleSelectLastEvent,
} from './calendar-utils'
import { ActivityPicker } from './ActivityPicker'
import { keyboardHandlers } from './keyboard-handlers'
import { ScheduleToolbar, calendarOptionsInfo } from './ScheduleToolbar'
import { CustomActivityModal, modeDetails } from './CustomActivity'
import { DropArea } from './DropArea'
import { ContextualMenu, contextualMenuSelector } from './ContextualMenu.jsx'
import { scheduleElementSelector, generateCalendar } from './fullcalendar'
import { timezoneData, friendlyTimezoneName } from 'wca/timezoneData.js.erb'



export class SchedulesEditor extends React.Component {
  constructor(props) {
    super(props);
    setupCalendarHandlers(this);
    setupConvertHandlers(this);
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
      <Row>
        <Col xs={3}>
          <ActivityPicker scheduleWcif={scheduleWcif} eventsWcif={eventsWcif} usedActivityCodeList={this.state.usedActivityCodeList} keyboardEnabled={this.state.keyboardEnabled} />
        </Col>
        <Col xs={9}>
          <Panel>
            <Panel.Heading>
              <RoomSelector scheduleWcif={scheduleWcif} selectedRoom={this.state.selectedRoom} handleRoomChange={this.handleRoomChange} />
            </Panel.Heading>
            <Panel.Body>
              {rightPanelBody}
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    );
  }
}

const NoRoomSelected = () => (
  <div>Please select a room to edit its schedule</div>
);

const RoomSelector = ({ scheduleWcif, selectedRoom, handleRoomChange }) => {
  let options = [
    <option key="0" value=""></option>
  ];

  scheduleWcif.venues.forEach(function (venue, venueIndex) {
    venue.rooms.forEach(function (room, roomIndex) {
      options.push(<option key={ room.id } value={ room.id }>"{room.name}" in "{venue.name}"</option>);
    });
  });

  return (
    <Row className="room-selector">
        <Col componentClass="label"
             htmlFor="venue-room-selector"
             className="control-label"
             xs={12} md={6} lg={5}
        >
          Select a room to edit its schedule:
        </Col>
        <Col xs={12} md={6} lg={7}>
          <select id="venue-room-selector" className="form-control input-sm" onChange={handleRoomChange} value={selectedRoom}>
            {options}
          </select>
        </Col>
    </Row>
  );
}

class EditScheduleForRoom extends React.Component {

  componentWillMount() {
    this.setState({
      selectedRoom: this.props.selectedRoom,
      showModal: false,
      eventProps: { name: "", activityCode: "" },
      actionDetails: modeDetails.create,
    });
  }

  handleShowModal = (eventProps, mode) => {
    this.setState(
      {
        showModal: true,
        eventProps: eventProps,
        actionDetails: modeDetails[mode]
      }, function() {
        $(window).off("keydown", keyboardHandlers.activityPicker);
      }
    );
  }

  handleHideModal = () => {
    this.setState({ showModal: false, eventProps: {} }, function() {
      $(window).keydown(keyboardHandlers.activityPicker);
    });
  }

  componentWillReceiveProps(newProps) {
    this.setState({ selectedRoom: newProps.selectedRoom });
  }

  componentDidMount() {
    let { scheduleWcif, locale } = this.props;

    let eventFetcher =  (start, end, timezone, callback) => {
      // Create a deep clone, otherwise FC will add some extra attributes that
      // will make the parent component think some changes have been made...
      callback(_.cloneDeep(roomWcifFromId(this.props.scheduleWcif, this.state.selectedRoom).activities));
    }

    generateCalendar(eventFetcher, this.handleShowModal, scheduleWcif, locale);
    singleSelectLastEvent(this.props.scheduleWcif, this.state.selectedRoom);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedRoom != this.state.selectedRoom) {
      $(scheduleElementSelector).fullCalendar("refetchEvents")
      singleSelectLastEvent(this.props.scheduleWcif, this.state.selectedRoom);
    }
  }

  render() {
    let { keyboardEnabled, handleKeyboardChange } = this.props;

    let venueWcif = venueWcifFromRoomId(this.props.scheduleWcif, this.state.selectedRoom);

    let actionsHandlers = {
      removeEvent: e => {
        e.preventDefault();
        removeEventFromCalendar($(contextualMenuSelector).data("event"));
      },
      editEvent: e => {
        e.preventDefault();
        this.handleShowModal($(contextualMenuSelector).data("event"), "edit");
      },
    };

    return (
      <Row id="schedule-editor">
        <Col xs={2}>
          <ScheduleToolbar keyboardEnabled={keyboardEnabled} handleKeyboardChange={handleKeyboardChange} />
        </Col>
        <Col xs={10}>
          <DropArea />
        </Col>
        <Col xs={12}>
          The timezone for this room is {friendlyTimezoneName(venueWcif.timezone)}.
        </Col>
        <Col xs={12} id="schedule-calendar" />
        <ContextualMenu actionsHandlers={actionsHandlers} />
        <CustomActivityModal show={this.state.showModal}
                             eventProps={this.state.eventProps}
                             handleHideModal={this.handleHideModal}
                             actionDetails={this.state.actionDetails}
        />
      </Row>
    );
  }
}
