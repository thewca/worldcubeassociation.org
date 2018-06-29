import {
  Icon,
} from 'leaflet/dist/leaflet.js';
import markerRed from 'images/leaflet/marker-icon-red.png';
import markerBlue from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export const redMarker = new Icon({
  iconUrl: markerRed,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const blueMarker = new Icon({
  iconUrl: markerBlue,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

