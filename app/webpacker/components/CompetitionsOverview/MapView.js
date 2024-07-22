import React, { useEffect } from 'react';

import {
  MapContainer, TileLayer, Marker, Popup,
} from 'react-leaflet';

import { BarLoader } from 'react-spinners';
import { userTileProvider } from '../../lib/leaflet-wca/providers';
import { redMarker, blueMarker } from '../../lib/leaflet-wca/markers';
import ResizeMapIFrame from '../../lib/utils/leaflet-iframe';
import 'leaflet/dist/leaflet.css';
import { isProbablyOver } from '../../lib/utils/competition-table';
import { competitionUrl } from '../../lib/requests/routes.js.erb';

// Limit number of markers on map, especially for "All Past Competitions"
const MAP_DISPLAY_LIMIT = 500;

function MapView({
  competitions,
  isLoading,
  fetchMoreCompetitions,
  hasMoreCompsToLoad,
}) {
  useEffect(() => {
    if (hasMoreCompsToLoad && competitions?.length < MAP_DISPLAY_LIMIT && !isLoading) {
      fetchMoreCompetitions();
    }
  }, [
    hasMoreCompsToLoad,
    competitions,
    isLoading,
    fetchMoreCompetitions,
  ]);

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
            icon={isProbablyOver(comp) ? blueMarker : redMarker}
          >
            <Popup>
              <a href={competitionUrl(comp.id)}>{comp.name}</a>
              <br />
              {`${comp.date_range} - ${comp.city}`}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <BarLoader loading={isLoading} cssOverride={{ width: '100%' }} />
    </div>
  );
}

export default MapView;
