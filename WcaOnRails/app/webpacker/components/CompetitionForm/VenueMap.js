import React from 'react';
import {
  Circle,
  Map,
  TileLayer,
} from 'react-leaflet';
import { userTileProvider } from '../../lib/leaflet-wca/providers';

function CompetitionsMap({ center, children }) {
  const provider = userTileProvider;

  return (
    <Map
      center={center}
      zoom={2}
      style={{
        /* Will move to competitions.scss later */
        height: '400px',
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
      }}
    >
      <TileLayer
        url={provider.url}
        attribution={provider.attribution}
        maxZoom={19}
      />
      {children}
    </Map>
  );
}

export default function VenueMap({ center }) {
  return (
    <CompetitionsMap center={center}>
      <Circle
        center={center}
        fill={false}
        radius={1000000}
        color="#d9534f"
      />
    </CompetitionsMap>
  );
}
