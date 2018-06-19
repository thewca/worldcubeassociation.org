import React from 'react'
import { rootRender } from 'edit-schedule'
import {
  convertVenueActivitiesToVenueTimezone,
  newRoomId,
  toMicrodegrees,
  toDegrees,
} from '../utils'
import { EditRoom } from './EditRoom'
import { compose, withProps } from "recompose"
import { withGoogleMap, GoogleMap, Marker } from "react-google-maps"
import { Panel, Row, Col } from 'react-bootstrap'
import { timezoneData } from 'wca/timezoneData.js.erb'

export class EditVenue extends React.Component {

  handleSinglePropertyChange = (e, propName) => {
    this.props.venueWcif[propName] = e.target.value;
    if (propName == "timezone") {
      convertVenueActivitiesToVenueTimezone(this.props.venueWcif);
    }
    rootRender();
  }

  handlePositionChange = event => {
    let pos = event.latLng;
    let newLat = toMicrodegrees(pos.lat());
    let newLng = toMicrodegrees(pos.lng());
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
                  <a href="#" onClick={removeVenueAction} className="btn btn-danger pull-right"><i className="fa fa-trash"></i></a>
                </Col>
              </Row>
            </Panel.Heading>
            <Panel.Body>
              <NameInput name={venueWcif.name} actionHandler={this.handleSinglePropertyChange}/>
              <VenueLocationInput
                lat={venueWcif.latitudeMicrodegrees}
                lng={venueWcif.longitudeMicrodegrees}
                actionHandler={this.handlePositionChange}
              />
              <TimezoneInput
                timezone={venueWcif.timezone}
                selectKeys={selectKeys}
                actionHandler={this.handleSinglePropertyChange}
                />
              <RoomsList venueWcif={venueWcif} actionsHandlers={actionsHandlers}/>
            </Panel.Body>
          </Panel>
        </div>
      </div>
    );
  }
}

const NameInput = ({name, actionHandler}) => {
  return (
    <Row>
      <Col xs={3}>
        <span className="venue-form-label control-label">Name:</span>
      </Col>
      <Col xs={9}>
        <input type="text" className="form-control" value={name} onChange={e => actionHandler(e, "name")} />
      </Col>
    </Row>
  );
}

const VenueLocationInput = ({lat, lng, actionHandler}) => {
  return (
    <Row>
      <Col xs={12}>
        <span className="venue-form-label control-label">Please pick the venue location below:</span>
      </Col>
      <Col xs={12}>
        <MapPickerComponent latitudeMicrodegrees={lat}
                            longitudeMicrodegrees={lng}
                            onPositionChange={actionHandler} />
      </Col>
    </Row>
  );
}

const MapPickerComponent = compose(
  withProps({
    containerElement: <div className="venue-map" />,
    mapElement: <div style={{ height: `100%` }} />,
  }),
  withGoogleMap
)((props) => {
  let { latitudeMicrodegrees, longitudeMicrodegrees, onPositionChange } = props;
  let lat = toDegrees(latitudeMicrodegrees);
  let lng = toDegrees(longitudeMicrodegrees);
  return (
    <GoogleMap
      defaultZoom={12}
      defaultCenter={{ lat: lat, lng: lng }}
    >
      <Marker position={{ lat: lat, lng: lng }} draggable={true} onDragEnd={onPositionChange} />
    </GoogleMap>
  );
})


const TimezoneInput = ({timezone, selectKeys, actionHandler}) => {
  return (
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
              <option key={key} value={timezoneData[key]}>{key}</option>
            );
          })}
        </select>
      </Col>
    </Row>
  );
}

const RoomsList = ({venueWcif, actionsHandlers}) => {
  return (
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
}

const NewRoom = ({ newRoomAction }) => {
  return (
    <Row>
      <Col xs={12}>
        <a href="#" className="btn btn-success new-room-link" onClick={newRoomAction}>Add room</a>
      </Col>
    </Row>
  );
}

function addRoomToVenue(venueWcif, competitionInfo) {
  venueWcif.rooms.push({
    id: newRoomId(),
    // Venue details is an optional field
    name: competitionInfo.venueDetails.length > 0 ? competitionInfo.venueDetails : "Room's name",
    activities: [],
  });
}
