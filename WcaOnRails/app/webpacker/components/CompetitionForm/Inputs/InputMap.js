import React, {
  useState,
  useEffect,
} from 'react';
import {
  Map,
  Marker,
  TileLayer,
  ZoomControl,
  useLeaflet,
} from 'react-leaflet';
import { GeoSearchControl as SearchControl } from 'leaflet-geosearch';
import { blueMarker } from '../../../lib/leaflet-wca/markers';
import { searchProvider, userTileProvider } from '../../../lib/leaflet-wca/providers';

// Copied from lib/leaflet-wca/index.js which had nothing exported.
function roundToMicrodegrees(toRound) {
  const val = toRound || 0;
  // To prevent are you sure? from firing even when nothing has changed,
  // explicitly round coordinates to an integer number of microdegrees.
  return Math.trunc(parseFloat(val) * 1e6) / 1e6;
}

export function DraggableMarker({
  coords,
  setCoords,
  disabled = false,
}) {
  const position = { lat: coords[0], lng: coords[1] };

  const updatePosition = (e) => {
    const newPos = e.target.getLatLng();

    const newCoords = [
      roundToMicrodegrees(newPos.lat),
      roundToMicrodegrees(newPos.lng),
    ];

    setCoords(e, newCoords);
  };

  return (
    <Marker
      draggable={!disabled}
      position={position}
      icon={blueMarker}
      onDragend={updatePosition}
      autoPanOnFocus={false}
    />
  );
}

export function StaticMarker({ coords }) {
  const position = { lat: coords[0], lng: coords[1] };

  return <Marker position={position} icon={blueMarker} />;
}

function GeoSearchControl({
  setCoords,
  setZoom,
}) {
  const { map } = useLeaflet();

  useEffect(() => {
    const searchControl = new SearchControl({
      provider: searchProvider,
      showMarker: false,
      showPopup: false,
      style: 'bar',
      retainZoomLevel: true,
      autoClose: true,
      searchLabel: 'Enter an address',
    });

    map.addControl(searchControl);
    map.on('geosearch/showlocation', (e) => {
      if (!e.location) return;

      const coords = [e.location.y, e.location.x];
      setCoords(e, coords);

      setZoom(11);
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map, setCoords, setZoom]);

  return null;
}

export function CompetitionsMap({
  coords,
  setCoords,
  children,
  id = undefined,
}) {
  const provider = userTileProvider;

  const [zoom, setZoom] = useState(8);

  return (
    <Map
      id={id}
      center={coords}
      zoom={zoom}
      zoomControl={false}
      onzoomend={(e) => setZoom(e.target.zoom)}
    >
      <TileLayer
        url={provider.url}
        attribution={provider.attribution}
        maxZoom={19}
      />
      <GeoSearchControl setCoords={setCoords} setZoom={setZoom} />
      <ZoomControl position="topright" />
      {children}
    </Map>
  );
}
