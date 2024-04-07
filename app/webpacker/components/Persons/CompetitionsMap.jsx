import React from 'react';
import {
  MapContainer, Marker, Popup, TileLayer,
} from 'react-leaflet';
import { userTileProvider } from '../../lib/leaflet-wca/providers';
import { blueMarker, redMarker } from '../../lib/leaflet-wca/markers';

function MarkerForCompetition({ competition }) {
  const markerImage = competition.is_probably_over ? blueMarker : redMarker;
  return (
    <Marker
      position={[competition.latitude_degrees, competition.longitude_degrees]}
      icon={markerImage}
      title={competition.name}
    >
      <Popup>
        <a href={competition.url}>{competition.name}</a>
        <br />
        {competition.marker_date}
        {' - '}
        {competition.cityName}
      </Popup>
    </Marker>
  );
}

export default function CompetitionsMap({ competitions }) {
  let sumLat = 0;
  let sumLon = 0;
  competitions.forEach((comp) => {
    sumLat += comp.latitude_degrees;
    sumLon += comp.longitude_degrees;
  });

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer
        style={{ height: '100%' }}
        center={[sumLat / competitions.length, sumLon / competitions.length]}
        zoom={2}
      >
        <TileLayer
          url={userTileProvider.url}
          attribution={userTileProvider.attribution}
          maxZoom={19}
        />
        {competitions.map((comp) => (<MarkerForCompetition key={comp.id} competition={comp} />))}
      </MapContainer>
    </div>
  );
}
