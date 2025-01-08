import React from 'react';
import {
  MapContainer, Marker, Popup, TileLayer,
} from 'react-leaflet';
import { userTileProvider } from '../../../lib/leaflet-wca/providers';
import { blueMarker, redMarker } from '../../../lib/leaflet-wca/markers';
import 'leaflet/dist/leaflet.css';
import { competitionUrl } from '../../../lib/requests/routes.js.erb';
import { isProbablyOver } from '../../../lib/utils/competition-table';

function MarkerForCompetition({ competition }) {
  const markerImage = isProbablyOver(competition) ? blueMarker : redMarker;

  const coordinateTuple = [
    competition.latitude_degrees,
    competition.longitude_degrees,
  ];

  return (
    <Marker
      position={coordinateTuple}
      icon={markerImage}
      title={competition.name}
    >
      <Popup>
        <a href={competitionUrl(competition.id)}>{competition.name}</a>
        <br />
        {competition.markerDate}
        {' - '}
        {competition.cityName}
      </Popup>
    </Marker>
  );
}

const mapAndAverage = (arr, mappingFn) => arr.map(mappingFn).join('+') / arr.length;

export default function CompetitionsMap({ competitions }) {
  const avgLatitude = mapAndAverage(competitions, (comp) => comp.latitude_degrees);
  const avgLongitude = mapAndAverage(competitions, (comp) => comp.longitude_degrees);

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer
        style={{ height: '100%' }}
        center={[avgLatitude, avgLongitude]}
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
