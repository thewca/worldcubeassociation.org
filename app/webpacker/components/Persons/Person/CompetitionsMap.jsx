import React from 'react';
import {
  MapContainer, Marker, Popup, TileLayer,
} from 'react-leaflet';
import { userTileProvider } from '../../../lib/leaflet-wca/providers';
import { blueMarker, redMarker } from '../../../lib/leaflet-wca/markers';

function MarkerForCompetition({ competition }) {
  const markerImage = competition.probablyOver ? blueMarker : redMarker;
  return (
    <Marker
      position={[competition.lat, competition.lng]}
      icon={markerImage}
      title={competition.name}
    >
      <Popup>
        <a href={competition.url}>{competition.name}</a>
        <br />
        {competition.markerDate}
        {' - '}
        {competition.cityName}
      </Popup>
    </Marker>
  );
}

export default function CompetitionsMap({ person }) {
  const competitions = [];

  const compIds = new Set();
  person.results.forEach((result) => {
    if (!compIds.has(result.competition.id)) {
      compIds.add(result.competition.id);
      competitions.push(result.competition);
    }
  });

  let sumLat = 0;
  let sumLon = 0;
  competitions.forEach((comp) => {
    sumLat += comp.lat;
    sumLon += comp.lng;
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
