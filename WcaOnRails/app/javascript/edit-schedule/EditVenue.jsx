import React from 'react'
import cn from 'classnames'
import ReactDOM from 'react-dom'
import { rootRender } from 'edit-schedule'
import { compose, withProps } from "recompose"
import { withGoogleMap, GoogleMap, Marker } from "react-google-maps"

function toMicrodegrees(coord) {
  return Math.trunc(parseFloat(coord)*1e6);
}

function toDegrees(coord) {
  return coord/1e6;
}

const MapPickerComponent = compose(
  withProps({
    containerElement: <div className="venue-map" />,
    mapElement: <div style={{ height: `100%` }} />,
  }),
  withGoogleMap
)((props) => {
  let { latitudeMicrodegrees, longitudeMicrodegrees, onPositionChange, refUpdater } = props;
  let lat = toDegrees(latitudeMicrodegrees);
  let lng = toDegrees(longitudeMicrodegrees);
  return (
    <GoogleMap
      defaultZoom={12}
      defaultCenter={{ lat: lat, lng: lng }}
    >
      <Marker position={{ lat: lat, lng: lng }} draggable={true} ref={refUpdater} onDragEnd={onPositionChange} />
    </GoogleMap>
  );
})

class EditRoom extends React.Component {
  componentWillMount() {
    this.setState({ ...this.props.roomWcif });
  }

  // FIXME: could be part of a common base class
  handleNameChange = e => {
    // Update parent's WCIF
    this.props.roomWcif.name = e.target.value;
    this.setState({ name: e.target.value });
    rootRender();
  }

  render() {
    let { roomWcif, removeRoomAction } = this.props;
    return (
      <div className="row">
        <div className="col-xs-9">
          <input type="text" className="form-control" value={roomWcif.name} onChange={this.handleNameChange} />
        </div>
        <div className="col-xs-3">
          <a href="#" onClick={removeRoomAction} className="btn btn-danger pull-right"><i className="fa fa-trash"></i></a>
        </div>
      </div>
    );
  }
}

export class EditVenue extends React.Component {

  componentWillMount() {
    this.setState({ ...this.props.venueWcif });
  }

  handleSinglePropertyChange = (e, propName) => {
    let partialNewState = {};
    partialNewState[propName] = e.target.value;
    // Update parent's WCIF
    this.props.venueWcif[propName] = partialNewState[propName];
    this.setState(partialNewState);
    rootRender();
  }

  markerRefUpdater = (input) => this.marker = input;

  handlePositionChange = () => {
    let pos = this.marker.getPosition();
    let newLat = toMicrodegrees(pos.lat());
    let newLng = toMicrodegrees(pos.lng());
    // Update parent's WCIF
    this.props.venueWcif.latitudeMicrodegrees = newLat;
    this.props.venueWcif.longitudeMicrodegrees = newLng;
    this.setState({ latitudeMicrodegrees: newLat, longitudeMicrodegrees: newLng });
    rootRender();
  }

  render() {
    let { venueWcif, removeVenueAction, tzMapping } = this.props;

    let addRoomAction = e => {
      e.preventDefault();
      addRoomToVenue(venueWcif);
      rootRender();
    };

    let removeRoomAction = (e, index) => {
      e.preventDefault();
      if (!confirm(`Are you sure you want to remove the room "${venueWcif.rooms[index].name}" and the associated schedule?`)) {
        return;
      }
      venueWcif.rooms.splice(index, 1);
      rootRender();
    };

    return (
      <div className="panel-venue">
        <div className="panel panel-default">
          <div className="panel-heading">
            <div className="row">
              <div className="col-xs-9 venue-title">
                Editing venue "{venueWcif.name}"
              </div>
              <div className="col-xs-3">
                <a href="#" onClick={removeVenueAction} className="btn btn-danger pull-right"><i className="fa fa-trash"></i></a>
              </div>
            </div>
          </div>
          <div className="panel-body">
            <div className="row form-horizontal">
              <div className="col-xs-3">
                <span className="venue-form-label control-label">Name:</span>
              </div>
              <div className="col-xs-9">
                <input type="text" className="form-control" value={venueWcif.name} onChange={e => this.handleSinglePropertyChange(e, "name")} />
              </div>
            </div>
            <div className="row form-horizontal">
              <div className="col-xs-12">
                <span className="venue-form-label control-label">Please pick the venue location below:</span>
              </div>
              <div className="col-xs-12">
                <MapPickerComponent latitudeMicrodegrees={venueWcif.latitudeMicrodegrees}
                                    longitudeMicrodegrees={venueWcif.longitudeMicrodegrees}
                                    onPositionChange={this.handlePositionChange}
                                    refUpdater={this.markerRefUpdater}/>
              </div>
            </div>
            <div className="row form-horizontal">
              <div className="col-xs-3">
                <span className="venue-form-label control-label">Timezone:</span>
              </div>
              <div className="col-xs-9">
                <select
                  className="form-control"
                  value={venueWcif.timezone}
                  onChange={e => this.handleSinglePropertyChange(e, "timezone")}
                  >
                  {Object.keys(tzMapping).sort().map(key => {
                    return (
                      <option key={key} value={tzMapping[key]}>{key}</option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="row form-horizontal">
              <div className="col-xs-3">
                <span className="venue-form-label control-label">Rooms:</span>
              </div>
              <div className="col-xs-9">
                {venueWcif.rooms.map((roomWcif, index) => {
                  return (
                    <EditRoom roomWcif={roomWcif} key={index} removeRoomAction={e => removeRoomAction(e, index)} />
                  );
                })}
                <NewRoomElement newRoomAction={addRoomAction} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function NewRoomElement({ newRoomAction }) {
  return (
    <div className="row">
      <div className="col-xs-12">
        <a href="#" className="btn btn-success new-room-link" onClick={newRoomAction}>Add room</a>
      </div>
    </div>
  );
}

function addRoomToVenue(venueWcif) {
  venueWcif.rooms.push({
    name: "Rooms's name",
    activities: [],
  });
}
