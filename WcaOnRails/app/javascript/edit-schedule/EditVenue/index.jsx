import React from 'react'
import { rootRender } from 'edit-schedule'
import {
  convertVenueActivitiesToVenueTimezone,
  newRoomId,
  toMicrodegrees,
} from '../utils'
import { defaultRoomColor } from './constants.js.erb'
import { EditRoom } from './EditRoom'
import { Button, Panel, Row, Col } from 'react-bootstrap'
import { timezoneData } from 'wca/timezoneData.js.erb'
import { VenueLocationInput } from './VenueLocationInput.jsx.erb'

export class EditVenue extends React.Component {

  handleTimezoneChange = e => {
    let oldTZ = this.props.venueWcif.timezone;
    this.props.venueWcif.timezone = e.target.value;
    convertVenueActivitiesToVenueTimezone(oldTZ, this.props.venueWcif);
    rootRender();
  }

  handleNameChange = e => {
    this.props.venueWcif.name = e.target.value;
    rootRender();
  }

  handlePositionChange = event => {
    let pos = event.target._latlng;
    let newLat = toMicrodegrees(pos.lat);
    let newLng = toMicrodegrees(pos.lng);
    // Update parent's WCIF
    this.props.venueWcif.latitudeMicrodegrees = newLat;
    this.props.venueWcif.longitudeMicrodegrees = newLng;
    rootRender();
  }

  render() {
    let { venueWcif, index, removeVenueAction, competitionInfo } = this.props;
    // Instead of giving *all* TZInfo, use uniq-fied rails "meaningful" subset
    // We'll add the "country_zones" to that, because some of our competitions
    // use TZs not included in this subset.
    // We want to display the "country_zones" first, so that it's more convenient for the user.
    // In the end the array should look like that:
    //   - country_zone_a, country_zone_b, [...], other_tz_a, other_tz_b, [...]
    let competitionZonesKeys = Object.keys(competitionInfo.countryZones);
    let selectKeys = _.difference(Object.keys(timezoneData), competitionZonesKeys);
    selectKeys = _.union(competitionZonesKeys.sort(), selectKeys.sort());

    let actionsHandlers = {
      addRoom: e => {
        e.preventDefault();
        addRoomToVenue(venueWcif, competitionInfo);
        rootRender();
      },
      removeRoom: (e, index) => {
        e.preventDefault();
        if (!confirm(`Are you sure you want to remove the room "${venueWcif.rooms[index].name}" and the associated schedule?`)) {
          return;
        }
        venueWcif.rooms.splice(index, 1);
        rootRender();
      },
    };
    return (
      <div>
        <div className="panel-venue">
          <Panel>
            <Panel.Heading>
              <Row>
                <Col xs={9} className="venue-title">
                  Editing venue "{venueWcif.name}"
                </Col>
                <Col xs={3}>
                  <Button onClick={removeVenueAction} bsStyle="danger" className="pull-right">
                    <i className="fa fa-trash"></i>
                  </Button>
                </Col>
              </Row>
            </Panel.Heading>
            <Panel.Body>
              <NameInput name={venueWcif.name} actionHandler={this.handleNameChange}/>
              <VenueLocationInput
                lat={venueWcif.latitudeMicrodegrees}
                lng={venueWcif.longitudeMicrodegrees}
                actionHandler={this.handlePositionChange}
              />
              <TimezoneInput
                timezone={venueWcif.timezone}
                selectKeys={selectKeys}
                actionHandler={this.handleTimezoneChange}
                />
              <RoomsList venueWcif={venueWcif} actionsHandlers={actionsHandlers}/>
            </Panel.Body>
          </Panel>
        </div>
      </div>
    );
  }
}

const NameInput = ({name, actionHandler}) => (
  <Row>
    <Col xs={3}>
      <span className="venue-form-label control-label">Name:</span>
    </Col>
    <Col xs={9}>
      <input type="text" className="venue-name-input form-control" value={name} onChange={e => actionHandler(e, "name")} />
    </Col>
  </Row>
);

const TimezoneInput = ({timezone, selectKeys, actionHandler}) => (
  <Row>
    <Col xs={3}>
      <span className="venue-form-label control-label">Timezone:</span>
    </Col>
    <Col xs={9}>
      <select
        className="form-control"
        value={timezone}
        onChange={e => actionHandler(e, "timezone")}
        >
        {selectKeys.map(key => {
          return (
            <option key={key} value={timezoneData[key] || key}>{key}</option>
          );
        })}
      </select>
    </Col>
  </Row>
);

const RoomsList = ({venueWcif, actionsHandlers}) => (
  <Row>
    <Col xs={3}>
      <span className="venue-form-label control-label">Rooms:</span>
    </Col>
    <Col xs={9}>
      {venueWcif.rooms.map((roomWcif, index) => {
        return (
          <EditRoom roomWcif={roomWcif} key={index} removeRoomAction={e => actionsHandlers.removeRoom(e, index)} />
        );
      })}
      <NewRoom newRoomAction={actionsHandlers.addRoom} />
    </Col>
  </Row>
);

const NewRoom = ({ newRoomAction }) => (
  <Row>
    <Col xs={12}>
      <a href="#" className="btn btn-success new-room-link" onClick={newRoomAction}>Add room</a>
    </Col>
  </Row>
);

function addRoomToVenue(venueWcif, competitionInfo) {
  venueWcif.rooms.push({
    id: newRoomId(),
    // Venue details is an optional (nullable) field
    name: competitionInfo.venueDetails ? competitionInfo.venueDetails : "Room's name",
    color: defaultRoomColor,
    activities: [],
  });
}
