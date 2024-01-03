import React from 'react';

import {
  MapContainer, TileLayer, Marker, Popup,
} from 'react-leaflet';

import { userTileProvider } from '../../lib/leaflet-wca/providers';
import { redMarker, blueMarker } from '../../lib/leaflet-wca/markers';
import 'leaflet/dist/leaflet.css';

function CompetitionMap({
  competitionData,
  selectedEvents,
  showCancelled,
}) {
  const provider = userTileProvider;
  const competitions = competitionData?.filter((comp) => (!comp.cancelled_at || showCancelled)
    && (selectedEvents.every((event) => comp.event_ids.includes(event))));

  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      scrollWheelZoom
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer url={provider.url} attribution={provider.attribution} />
      {competitions?.map((comp) => (
        <Marker
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
  );
}

export default CompetitionMap;
