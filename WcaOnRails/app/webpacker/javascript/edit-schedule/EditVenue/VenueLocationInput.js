import React from 'react';
import { Row, Col } from 'react-bootstrap';
// Import leaflet, and the fix for the icon url
import { Map, TileLayer, Marker } from 'react-leaflet';
import '../../leaflet-wca';
import { userTileProvider } from '../../leaflet-wca/providers';
import { toDegrees } from '../utils';

/* eslint react/prop-types: "off" */
/* eslint max-classes-per-file: "off" */

class InvisibleIFrame extends React.Component {
  componentDidMount() {
    const { onResizeAction } = this.props;
    this.iframe.contentWindow.addEventListener('resize', onResizeAction);
  }

  componentWillUnmount() {
    const { onResizeAction } = this.props;
    this.iframe.contentWindow.removeEventListener('resize', onResizeAction);
  }

  render() {
    return (
      <iframe
        title="invisibleIFrame"
        src="about:blank"
        className="invisible-iframe-map"
        ref={(m) => { this.iframe = m; }}
      />
    );
  }
}

export default class VenueLocationInput extends React.Component {
  componentDidMount() {
    const map = this.mapElem.leafletElement;
    window.wca.createSearchInput(map);
    const handleGeoSearchResult = (result) => {
      const marker = this.markerElem.leafletElement;
      marker.setLatLng({
        lat: result.location.y,
        lng: result.location.x,
      });
      marker.bindPopup(result.location.label).openPopup();
    };
    map.on('geosearch/showlocation', handleGeoSearchResult);
    map.zoomControl.setPosition('bottomright');
  }

  render() {
    const { lat, lng, actionHandler } = this.props;
    const provider = userTileProvider;
    const mapPosition = { lat: toDegrees(lat), lng: toDegrees(lng) };

    const invalidateSize = () => {
      this.mapElem.leafletElement.invalidateSize(false);
    };

    return (
      <Row>
        <Col xs={12}>
          <span className="venue-form-label control-label">Please pick the venue location below:</span>
        </Col>
        <Col xs={12} className="venue-map">
          <Map
            center={mapPosition}
            zoom={16}
            scrollWheelZoom={false}
            ref={(m) => { this.mapElem = m; }}
          >
            <InvisibleIFrame onResizeAction={invalidateSize} />
            <TileLayer url={provider.url} attribution={provider.attribution} />
            <Marker
              position={mapPosition}
              draggable
              onMove={actionHandler}
              ref={(m) => { this.markerElem = m; }}
            />
          </Map>
        </Col>
      </Row>
    );
  }
}
