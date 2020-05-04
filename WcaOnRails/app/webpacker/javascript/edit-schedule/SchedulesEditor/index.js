import React from 'react';
import _ from 'lodash';
import {
  Col,
  Panel,
  Row,
} from 'react-bootstrap';
import {
  activityCodeListFromWcif,
  roomWcifFromId,
} from '../../wca/wcif-utils';
import {
  setupConvertHandlers,
} from './calendar-utils';
import ActivityPicker from './ActivityPicker';
import { schedulesEditPanelSelector } from './ses';
import EditScheduleForRoom from './EditScheduleForRoom';

/* eslint react/prop-types: "off" */

export default class SchedulesEditor extends React.Component {
  constructor(props) {
    super(props);
    const { setupCalendarHandlers } = props;
    setupCalendarHandlers(this);
    setupConvertHandlers(this);
    this.state = {
      selectedRoom: '',
      usedActivityCodeList: activityCodeListFromWcif(props.scheduleWcif),
      keyboardEnabled: false,
    };
  }

  componentDidMount() {
    // We cannot handle well changes (such as room color) when fullCalendar's element is hidden.
    // So we unselect the room when our panel becomes hidden, to avoid running into any visual bug.
    $(schedulesEditPanelSelector).find('.panel-collapse').on('hidden.bs.collapse',
      () => this.setState({ selectedRoom: '' }));
  }

  /* eslint camelcase: ["error", {allow: ["UNSAFE_componentWillReceiveProps"]}] */
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { selectedRoom } = this.state;
    if (!roomWcifFromId(nextProps.scheduleWcif, selectedRoom)) {
      this.setState({ selectedRoom: '' });
    }
    this.setState({ usedActivityCodeList: activityCodeListFromWcif(nextProps.scheduleWcif) });
  }

  render() {
    const { scheduleWcif, eventsWcif, locale } = this.props;

    const handleToggleKeyboardEnabled = () => {
      const { keyboardEnabled } = this.state;
      this.setState({ keyboardEnabled: !keyboardEnabled });
    };

    const handleRoomChange = (e) => {
      this.setState({ selectedRoom: e.target.value });
    };

    const { keyboardEnabled, selectedRoom, usedActivityCodeList } = this.state;

    return (
      <Row>
        <Col xs={3}>
          <ActivityPicker
            scheduleWcif={scheduleWcif}
            eventsWcif={eventsWcif}
            usedActivityCodeList={usedActivityCodeList}
            keyboardEnabled={keyboardEnabled}
          />
        </Col>
        <Col xs={9}>
          <Panel>
            <Panel.Heading>
              <RoomSelector
                scheduleWcif={scheduleWcif}
                selectedRoom={selectedRoom}
                handleRoomChange={handleRoomChange}
              />
            </Panel.Heading>
            <Panel.Body>
              {selectedRoom.length === 0 ? (
                <div>Please select a room to edit its schedule</div>
              ) : (
                <EditScheduleForRoom
                  scheduleWcif={scheduleWcif}
                  locale={locale}
                  keyboardEnabled={keyboardEnabled}
                  handleKeyboardChange={handleToggleKeyboardEnabled}
                  selectedRoom={selectedRoom}
                />
              )}
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    );
  }
}

/* eslint jsx-a11y/control-has-associated-label: "off" */
const RoomSelector = ({ scheduleWcif, selectedRoom, handleRoomChange }) => (
  <Row className="room-selector">
    <Col
      componentClass="label"
      htmlFor="venue-room-selector"
      className="control-label"
      xs={12}
      md={6}
      lg={5}
    >
      Select a room to edit its schedule:
    </Col>
    <Col xs={12} md={6} lg={7}>
      <select
        id="venue-room-selector"
        className="form-control input-sm"
        onChange={handleRoomChange}
        value={selectedRoom}
      >
        {[<option key="0" value="" />].concat(
          _.flatMap(scheduleWcif.venues, (venue) => _.map(
            venue.rooms,
            (room) => (
              <option key={room.id} value={room.id}>
                &quot;
                {room.name}
                &quot; in &quot;
                {venue.name}
                &quot;
              </option>
            ),
          )),
        )}
      </select>
    </Col>
  </Row>
);
