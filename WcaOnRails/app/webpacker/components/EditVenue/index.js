import React from 'react';
import _ from 'lodash';
import {
  Button, Panel, Row, Col,
} from 'react-bootstrap';
import { Icon } from 'semantic-ui-react';
import rootRender from '../../lib/edit-schedule';
import { timezoneData, countries, defaultRoomColor } from '../../lib/wca-data.js.erb';
import EditRoom from './EditRoom';
import {
  convertVenueActivitiesToVenueTimezone,
  newRoomId,
  toMicrodegrees,
} from '../../lib/utils/edit-schedule';
import VenueLocationInput from './VenueLocationInput';

/* eslint react/prop-types: "off" */
/* eslint react/prefer-stateless-function: "off" */
/* eslint import/no-cycle: "off" */
/* eslint no-restricted-globals: "off" */
/* eslint jsx-a11y/anchor-is-valid: "off" */
/* eslint jsx-a11y/control-has-associated-label: "off" */
/* eslint no-alert: "off" */

function addRoomToVenue(venueWcif, competitionInfo) {
  venueWcif.rooms.push({
    id: newRoomId(),
    // Venue details is an optional (nullable) field
    name: competitionInfo.venueDetails ? competitionInfo.venueDetails : "Room's name",
    color: defaultRoomColor,
    activities: [],
  });
}

export default class EditVenue extends React.Component {
  render() {
    const {
      venueWcif, removeVenueAction, competitionInfo,
    } = this.props;

    const handleTimezoneChange = (e) => {
      const oldTZ = venueWcif.timezone;
      venueWcif.timezone = e.target.value;
      convertVenueActivitiesToVenueTimezone(oldTZ, venueWcif);
      rootRender();
    };

    const handleNameChange = (e) => {
      venueWcif.name = e.target.value;
      rootRender();
    };

    const handleCountryChange = (e) => {
      venueWcif.countryIso2 = e.target.value;
      rootRender();
    };

    const handlePositionChange = (event) => {
      /* eslint-disable-next-line */
      const pos = event.target._latlng;
      const newLat = toMicrodegrees(pos.lat);
      const newLng = toMicrodegrees(pos.lng);
      // Update parent's WCIF
      if (venueWcif.latitudeMicrodegrees !== newLat
        || venueWcif.longitudeMicrodegrees !== newLng) {
        venueWcif.latitudeMicrodegrees = newLat;
        venueWcif.longitudeMicrodegrees = newLng;
        rootRender();
      }
    };

    // Instead of giving *all* TZInfo, use uniq-fied rails "meaningful" subset
    // We'll add the "country_zones" to that, because some of our competitions
    // use TZs not included in this subset.
    // We want to display the "country_zones" first, so that it's more convenient for the user.
    // In the end the array should look like that:
    //   - country_zone_a, country_zone_b, [...], other_tz_a, other_tz_b, [...]
    const competitionZonesKeys = Object.keys(competitionInfo.countryZones);
    let selectKeys = _.difference(Object.keys(timezoneData), competitionZonesKeys);
    selectKeys = _.union(competitionZonesKeys.sort(), selectKeys.sort());

    const actionsHandlers = {
      addRoom: (e) => {
        e.preventDefault();
        addRoomToVenue(venueWcif, competitionInfo);
        rootRender();
      },
      removeRoom: (e, i) => {
        e.preventDefault();
        if (!confirm(`Are you sure you want to remove the room "${venueWcif.rooms[i].name}" and the associated schedule?`)) {
          return;
        }
        venueWcif.rooms.splice(i, 1);
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
                  Editing venue &quot;
                  {venueWcif.name}
                  &quot;
                </Col>
                <Col xs={3}>
                  <Button onClick={removeVenueAction} bsStyle="danger" className="pull-right">
                    <Icon name="trash" />
                  </Button>
                </Col>
              </Row>
            </Panel.Heading>
            <Panel.Body>
              <NameInput name={venueWcif.name} actionHandler={handleNameChange} />
              <VenueLocationInput
                lat={venueWcif.latitudeMicrodegrees}
                lng={venueWcif.longitudeMicrodegrees}
                actionHandler={handlePositionChange}
              />
              <CountryInput value={venueWcif.countryIso2} onChange={handleCountryChange} />
              <TimezoneInput
                timezone={venueWcif.timezone}
                selectKeys={selectKeys}
                actionHandler={handleTimezoneChange}
              />
              <RoomsList venueWcif={venueWcif} actionsHandlers={actionsHandlers} />
            </Panel.Body>
          </Panel>
        </div>
      </div>
    );
  }
}

function NameInput({ name, actionHandler }) {
  return (
    <Row>
      <Col xs={3}>
        <span className="venue-form-label control-label">Name:</span>
      </Col>
      <Col xs={9}>
        <input type="text" className="venue-name-input form-control" value={name} onChange={(e) => actionHandler(e, 'name')} />
      </Col>
    </Row>
  );
}

function CountryInput({ value, onChange }) {
  return (
    <Row>
      <Col xs={3}>
        <span className="venue-form-label control-label">Country:</span>
      </Col>
      <Col xs={9}>
        <select
          className="form-control"
          value={value}
          onChange={onChange}
        >
          {countries.real.map((country) => (
            <option key={country.iso2} value={country.iso2}>
              {country.name}
            </option>
          ))}
        </select>
      </Col>
    </Row>
  );
}

function TimezoneInput({ timezone, selectKeys, actionHandler }) {
  return (
    <Row>
      <Col xs={3}>
        <span className="venue-form-label control-label">Timezone:</span>
      </Col>
      <Col xs={9}>
        <select
          className="venue-timezone-input form-control"
          value={timezone}
          onChange={(e) => actionHandler(e, 'timezone')}
        >
          <option value="" />
          {selectKeys.map((key) => (
            <option key={key} value={timezoneData[key] || key}>{key}</option>
          ))}
        </select>
      </Col>
    </Row>
  );
}

function RoomsList({ venueWcif, actionsHandlers }) {
  return (
    <Row>
      <Col xs={3}>
        <span className="venue-form-label control-label">Rooms:</span>
      </Col>
      <Col xs={9}>
        {venueWcif.rooms.map((roomWcif, index) => (
          <EditRoom
            roomWcif={roomWcif}
            key={roomWcif.id}
            removeRoomAction={(e) => actionsHandlers.removeRoom(e, index)}
          />
        ))}
        <NewRoom newRoomAction={actionsHandlers.addRoom} />
      </Col>
    </Row>
  );
}

function NewRoom({ newRoomAction }) {
  return (
    <Row>
      <Col xs={12}>
        <a href="#" className="btn btn-success new-room-link" onClick={newRoomAction}>Add room</a>
      </Col>
    </Row>
  );
}
