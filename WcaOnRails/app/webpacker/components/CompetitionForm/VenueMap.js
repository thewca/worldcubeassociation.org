/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useRef, useState, useEffect } from 'react';
import {
  Circle,
  Map,
  Marker,
  TileLayer,
  ZoomControl,
  useLeaflet,
} from 'react-leaflet';
import { GeoSearchControl as SearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { userTileProvider } from '../../lib/leaflet-wca/providers';
import { blueMarker } from '../../lib/leaflet-wca/markers';

// Copied from lib/leaflet-wca/index.js which had nothing exported.
function roundToMicrodegrees(toRound) {
  const val = toRound || 0;
  // To prevent are you sure? from firing even when nothing has changed,
  // explicitly round coordinates to an integer number of microdegrees.
  return Math.trunc(parseFloat(val) * 1e6) / 1e6;
}

function DraggableMarker({ latData, longData }) {
  const position = { lat: latData.value, lng: longData.value };
  const markerRef = useRef(null);

  const updatePosition = () => {
    const marker = markerRef.current;
    if (marker == null) return;
    const newPos = marker.leafletElement.getLatLng();
    latData.setValue(roundToMicrodegrees(newPos.lat));
    longData.setValue(roundToMicrodegrees(newPos.lng));
  };

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      icon={blueMarker}
      onDragend={updatePosition}
      autoPanOnFocus={false}
    />
  );
}

function GeoSearchControl({ latData, longData }) {
  const { map } = useLeaflet();

  useEffect(() => {
    const searchControl = new SearchControl({
      provider: new OpenStreetMapProvider(), // TODO: Use our own, but that doesnt seem to work
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
      latData.setValue(roundToMicrodegrees(e.location.y));
      longData.setValue(roundToMicrodegrees(e.location.x));
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}

function CompetitionsMap({ latData, longData, children }) {
  const provider = userTileProvider;
  const center = [latData.value || 0, longData.value || 0];

  const [zoom, setZoom] = useState(8);

  return (
    <Map
      center={center}
      zoom={zoom}
      zoomControl={false}
      style={{
        /* Will move to competitions.scss later */
        height: '400px',
        width: '100%',
        margin: '1rem 0 1rem 0',
      }}
      onzoomend={(e) => setZoom(e.target.zoom)}
    >
      <TileLayer
        url={provider.url}
        attribution={provider.attribution}
        maxZoom={19}
      />
      <GeoSearchControl latData={latData} longData={longData} />
      <ZoomControl position="topright" />
      {children}
    </Map>
  );
}

export default function VenueMap({
  latData, longData, warningDist, dangerDist,
}) {
  const center = [latData.value || 0, longData.value || 0];

  return (
    <CompetitionsMap latData={latData} longData={longData}>
      <Circle
        center={center}
        fill={false}
        radius={dangerDist * 1000}
        color="#d9534f"
      />
      <Circle
        center={center}
        fill={false}
        radius={warningDist * 1000}
        color="#f0ad4e"
      />
      <DraggableMarker latData={latData} longData={longData} />
    </CompetitionsMap>
  );
}
