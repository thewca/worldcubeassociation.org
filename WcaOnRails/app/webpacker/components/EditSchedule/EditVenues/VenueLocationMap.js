import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { toDegrees, toMicrodegrees } from '../../../lib/utils/edit-schedule';
import InvisibleIFrame from './InvisibleIFrame';
import { userTileProvider } from '../../../lib/leaflet-wca/providers';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { editVenue } from '../store/actions';

function VenueLocationMap({
  venue,
}) {
  const mapElem = useRef();
  const markerElem = useRef();

  const dispatch = useDispatch();

  const mapPosition = useMemo(() => ({
    lat: toDegrees(venue.latitudeMicrodegrees),
    lng: toDegrees(venue.longitudeMicrodegrees),
  }), [venue.latitudeMicrodegrees, venue.longitudeMicrodegrees]);

  const provider = userTileProvider;

  const invalidateSize = () => {
    mapElem.current.leafletElement.invalidateSize(false);
  };

  const onGeoSearchResult = useCallback((result) => {
    const marker = markerElem.current.leafletElement;

    marker.setLatLng({
      lat: result.location.y,
      lng: result.location.x,
    });

    marker
      .bindPopup(result.location.label)
      .openPopup();
  }, [markerElem]);

  useEffect(() => {
    const map = mapElem.current.leafletElement;

    window.wca.createSearchInput(map);

    map.on('geosearch/showlocation', onGeoSearchResult);
    map.zoomControl.setPosition('bottomright');
  }, [mapElem, onGeoSearchResult]);

  const onPositionChange = (evt) => {
    /* eslint-disable-next-line */
    const pos = evt.target._latlng;

    const newLat = toMicrodegrees(pos.lat);
    const newLng = toMicrodegrees(pos.lng);

    dispatch(editVenue(venue.id, 'latitudeMicrodegrees', newLat));
    dispatch(editVenue(venue.id, 'longitudeMicrodegrees', newLng));
  };

  return (
    <Map
      center={mapPosition}
      zoom={16}
      scrollWheelZoom={false}
      ref={mapElem}
      style={{ height: '100%' }}
    >
      <InvisibleIFrame onResizeAction={invalidateSize} />
      <TileLayer url={provider.url} attribution={provider.attribution} />
      <Marker
        position={mapPosition}
        draggable
        onMove={onPositionChange}
        ref={markerElem}
      />
    </Map>
  );
}

export default VenueLocationMap;
