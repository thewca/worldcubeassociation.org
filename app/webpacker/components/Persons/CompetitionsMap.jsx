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
  return (
    <MapContainer
      style={{ height: '500px', width: '100%' }}
      center={[0, 0]}
      zoom={2}
    >
      <TileLayer
        url={userTileProvider.url}
        attribution={userTileProvider.attribution}
        maxZoom={19}
      />
      {competitions.map((comp) => (<MarkerForCompetition key={comp.id} competition={comp} />))}
    </MapContainer>
  );
}
