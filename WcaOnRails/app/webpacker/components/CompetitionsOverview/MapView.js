import React, { useEffect } from 'react';

import {
  MapContainer, TileLayer, Marker, Popup,
} from 'react-leaflet';

import { userTileProvider } from '../../lib/leaflet-wca/providers';
import { redMarker, blueMarker } from '../../lib/leaflet-wca/markers';
import ResizeMapIFrame from '../../lib/utils/leaflet-iframe';
import 'leaflet/dist/leaflet.css';

// Limit number of markers on map, especially for "All Past Competitions"
const MAP_DISPLAY_LIMIT = 500;

function MapView({
  competitions,
  fetchMoreCompetitions,
  hasMoreCompsToLoad,
}) {
  useEffect(() => {
    if (hasMoreCompsToLoad && competitions?.length < MAP_DISPLAY_LIMIT) {
      fetchMoreCompetitions();
    }
  }, [hasMoreCompsToLoad, competitions,
    fetchMoreCompetitions]);

  const provider = userTileProvider;

  return (
    <div name="competitions-map">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        scrollWheelZoom
        style={{ height: '400px', width: '100%' }}
      >
        <ResizeMapIFrame />
        <TileLayer url={provider.url} attribution={provider.attribution} />
        {competitions?.slice(0, MAP_DISPLAY_LIMIT).map((comp) => (
          <Marker
            key={comp.id}
            position={{ lat: comp.latitude_degrees, lng: comp.longitude_degrees }}
            icon={comp.isProbablyOver ? blueMarker : redMarker}
          >
            <Popup>
              <a href={comp.url}>{comp.name}</a>
              <br />
              {`${comp.dateRange} - ${comp.cityName}`}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;
