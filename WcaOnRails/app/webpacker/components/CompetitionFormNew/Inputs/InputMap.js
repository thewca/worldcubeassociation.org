import React, {
  useState,
  useEffect, useContext,
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
import { nearbyCompetitionDistanceWarning, nearbyCompetitionDistanceDanger } from '../../../lib/wca-data.js.erb';
import { blueMarker } from '../../../lib/leaflet-wca/markers';
import { userTileProvider } from '../../../lib/leaflet-wca/providers';
import FormContext from '../State/FormContext';

// Copied from lib/leaflet-wca/index.js which had nothing exported.
function roundToMicrodegrees(toRound) {
  const val = toRound || 0;
  // To prevent are you sure? from firing even when nothing has changed,
  // explicitly round coordinates to an integer number of microdegrees.
  return Math.trunc(parseFloat(val) * 1e6) / 1e6;
}

function DraggableMarker({
  lat,
  long,
  setLat,
  setLong,
}) {
  const position = { lat, lng: long };

  const updatePosition = (e) => {
    const newPos = e.target.getLatLng();
    setLat(roundToMicrodegrees(newPos.lat));
    setLong(roundToMicrodegrees(newPos.lng));
  };

  return (
    <Marker
      draggable
      position={position}
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

function GeoSearchControl({
  setLat,
  setLong,
  setZoom,
}) {
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
      setLat(roundToMicrodegrees(e.location.y));
      setLong(roundToMicrodegrees(e.location.x));
      setZoom(11);
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}

function CompetitionsMap({
  lat,
  long,
  setLat,
  setLong,
  children,
}) {
  const provider = userTileProvider;
  const center = [lat || 0, long || 0];

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
      <GeoSearchControl setLat={setLat} setLong={setLong} setZoom={setZoom} />
      <ZoomControl position="topright" />
      {children}
    </Map>
  );
}

export default function InputMap({
  idLat,
  idLong,
  markers,
}) {
  const { formData, setFormData } = useContext(FormContext);

  const lat = Number.isNaN(parseFloat(formData[idLat])) ? 0 : Number(formData[idLat]);
  const long = Number.isNaN(parseFloat(formData[idLong])) ? 0 : Number(formData[idLong]);

  const setLat = (newLat) => setFormData((d) => ({ ...d, [idLat]: newLat }));
  const setLong = (newLong) => setFormData((d) => ({ ...d, [idLong]: newLong }));

  const center = [lat, long];

  const dangerDist = nearbyCompetitionDistanceDanger;
  const warningDist = nearbyCompetitionDistanceWarning;

  return (
    <CompetitionsMap lat={lat} long={long} setLat={setLat} setLong={setLong}>
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
      <DraggableMarker lat={lat} long={long} setLat={setLat} setLong={setLong} />
      {markers && markers.map((marker) => (
        <StaticMarker key={marker.id} lat={marker.lat} lng={marker.long} />
      ))}
    </CompetitionsMap>
  );
}
