/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, {
  useRef,
  useState,
  useEffect,
  useContext,
} from 'react';
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
import FormContext from './FormContext';

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
    latData.onChange(roundToMicrodegrees(newPos.lat));
    longData.onChange(roundToMicrodegrees(newPos.lng));
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

function StaticMarker({ lat, lng }) {
  const position = { lat, lng };
  return <Marker position={position} icon={blueMarker} />;
}

function GeoSearchControl({ latData, longData, setZoom }) {
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
      latData.onChange(roundToMicrodegrees(e.location.y));
      longData.onChange(roundToMicrodegrees(e.location.x));
      setZoom(11);
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}

function CompetitionsMap({
  latData, longData, children, disabled,
}) {
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
      {!disabled && <GeoSearchControl latData={latData} longData={longData} setZoom={setZoom} />}
      <ZoomControl position="topright" />
      {children}
    </Map>
  );
}

export default function VenueMap({
  latData, longData, warningDist, dangerDist, markers,
}) {
  const center = [latData.value || 0, longData.value || 0];

  const { disabled } = useContext(FormContext);

  return (
    <CompetitionsMap latData={latData} longData={longData} disabled={disabled}>
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
      {!disabled && <DraggableMarker latData={latData} longData={longData} />}
      {disabled && <StaticMarker lat={latData.value} lng={longData.value} />}
      {markers.map((marker) => (
        <StaticMarker key={marker.id} lat={marker.lat} lng={marker.lng} />
      ))}
    </CompetitionsMap>
  );
}
