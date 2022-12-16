import React from 'react';
import _ from 'lodash';
import {
  Col,
  Row,
} from 'react-bootstrap';

import { friendlyTimezoneName } from '../../lib/wca-data.js.erb';
import {
  roomWcifFromId,
  venueWcifFromRoomId,
} from '../../lib/utils/wcif';
import {
  removeEventFromCalendar,
  singleSelectLastEvent,
} from '../../lib/utils/calendar';
import { keyboardHandlers } from '../../lib/helpers/keyboard-handlers';
import { ScheduleToolbar } from './ScheduleToolbar';
import { CustomActivityModal, modeDetails } from './CustomActivity';
import { DropArea } from './DropArea';
import { ContextualMenu, contextualMenuSelector } from './ContextualMenu';
import { scheduleElementSelector } from '../../lib/helpers/edit-schedule';
import generateCalendar from '../../lib/helpers/fullcalendar';

/* eslint react/prop-types: "off" */

export default class EditScheduleForRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      eventProps: { name: '', activityCode: '' },
      actionDetails: modeDetails.create,
    };
    this.handleShowModal = this.handleShowModal.bind(this);
    this.eventFetcher = this.eventFetcher.bind(this);
  }

  componentDidMount() {
    const { scheduleWcif, locale, selectedRoom } = this.props;

    const room = roomWcifFromId(scheduleWcif, selectedRoom);
    const additionalOptions = {
      locale,
      eventColor: room.color,
    };

    generateCalendar(this.eventFetcher, this.handleShowModal, scheduleWcif, additionalOptions);
    singleSelectLastEvent(scheduleWcif, selectedRoom);
  }

  componentDidUpdate(prevProps) {
    const { scheduleWcif, selectedRoom } = this.props;
    if (prevProps.selectedRoom !== selectedRoom) {
      const room = roomWcifFromId(scheduleWcif, selectedRoom);
      $(scheduleElementSelector).fullCalendar('refetchEvents');
      $(scheduleElementSelector).fullCalendar('option', 'eventColor', room.color);
      singleSelectLastEvent(scheduleWcif, selectedRoom);
    }
  }

  handleShowModal(eventProps, mode) {
    this.setState(
      {
        showModal: true,
        eventProps,
        actionDetails: modeDetails[mode],
      },
      () => $(window).off('keydown', keyboardHandlers.activityPicker),
    );
  }

  eventFetcher(start, end, timezone, callback) {
    // Create a deep clone, otherwise FC will add some extra attributes that
    // will make the parent component think some changes have been made...
    const { scheduleWcif, selectedRoom } = this.props;
    callback(_.cloneDeep(
      roomWcifFromId(scheduleWcif, selectedRoom).activities,
    ));
  }

  render() {
    const {
      keyboardEnabled,
      handleKeyboardChange,
      selectedRoom,
      scheduleWcif,
    } = this.props;

    const venueWcif = venueWcifFromRoomId(scheduleWcif, selectedRoom);

    const actionsHandlers = {
      removeEvent: (e) => {
        e.preventDefault();
        removeEventFromCalendar($(contextualMenuSelector).data('event'));
      },
      editEvent: (e) => {
        e.preventDefault();
        this.handleShowModal($(contextualMenuSelector).data('event'), 'edit');
      },
    };

    const handleHideModal = () => {
      this.setState({
        showModal: false,
        eventProps: {},
      }, () => $(window).keydown(keyboardHandlers.activityPicker));
    };

    const { showModal, eventProps, actionDetails } = this.state;

    return (
      <Row id="schedule-editor">
        <Col xs={2}>
          <ScheduleToolbar
            keyboardEnabled={keyboardEnabled}
            handleKeyboardChange={handleKeyboardChange}
          />
        </Col>
        <Col xs={10}>
          <DropArea />
        </Col>
        <Col xs={12}>
          The timezone for this room is
          {friendlyTimezoneName(venueWcif.timezone)}
          .
        </Col>
        <Col xs={12} id="schedule-calendar" />
        <ContextualMenu actionsHandlers={actionsHandlers} />
        <CustomActivityModal
          show={showModal}
          eventProps={eventProps}
          handleHideModal={handleHideModal}
          actionDetails={actionDetails}
        />
      </Row>
    );
  }
}
