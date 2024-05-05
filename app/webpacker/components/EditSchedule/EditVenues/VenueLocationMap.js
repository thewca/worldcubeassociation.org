import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { toDegrees, toMicrodegrees } from '../../../lib/utils/edit-schedule';
import { userTileProvider } from '../../../lib/leaflet-wca/providers';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { editVenue } from '../store/actions';
import ResizeMapIFrame from '../../../lib/utils/leaflet-iframe';

function GeoSearchControl({
  onGeoSearchResult,
}) {
  const map = useMap();

  useEffect(() => {
    const searchControl = window.wca.createSearchInput(map);

    map.on('geosearch/showlocation', onGeoSearchResult);
    map.zoomControl.setPosition('bottomright');

    return () => {
      map.removeControl(searchControl);
    };
  }, [map, onGeoSearchResult]);

  return null;
}

export function DraggableMarker({
  position,
  setPosition,
  disabled = false,
  markerRef = null,
  children,
}) {
  const map = useMap();

  const updatePosition = useCallback((e) => setPosition(e, e.target.getLatLng()), [setPosition]);

  useEffect(() => {
    map.panTo(position);
  }, [map, position]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable={!disabled}
      eventHandlers={{
        dragend: updatePosition,
      }}
    >
      {children}
    </Marker>
  );
}

function VenueLocationMap({
  venue,
}) {
  const dispatch = useDispatch();
  const markerRef = useRef();

  const [searchResultPopup, setSearchResultPopup] = useState();

  const markerPopup = useMemo(() => {
    if (searchResultPopup) {
      return <Popup>{searchResultPopup}</Popup>;
    }

    return null;
  }, [searchResultPopup]);

  const venuePosition = useMemo(() => ({
    lat: toDegrees(venue.latitudeMicrodegrees),
    lng: toDegrees(venue.longitudeMicrodegrees),
  }), [venue.latitudeMicrodegrees, venue.longitudeMicrodegrees]);

  const setVenuePosition = useCallback((evt, { lat, lng }) => {
    dispatch(editVenue(venue.id, 'latitudeMicrodegrees', toMicrodegrees(lat)));
    dispatch(editVenue(venue.id, 'longitudeMicrodegrees', toMicrodegrees(lng)));
  }, [dispatch, venue.id]);

  const provider = userTileProvider;

  const onGeoSearchResult = useCallback((evt) => {
    setVenuePosition(evt, {
      lat: evt.location.y,
      lng: evt.location.x,
    });

    setSearchResultPopup(evt.location.label);
  }, [setVenuePosition, setSearchResultPopup]);

  return (
    <MapContainer
      // note: `center` only applies to initial render
      center={venuePosition}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: '100%' }}
    >
      <ResizeMapIFrame />
      <TileLayer url={provider.url} attribution={provider.attribution} />
      <GeoSearchControl onGeoSearchResult={onGeoSearchResult} />
      <DraggableMarker
        markerRef={markerRef}
        position={venuePosition}
        setPosition={setVenuePosition}
      >
        {markerPopup}
      </DraggableMarker>
    </MapContainer>
  );
}

export default VenueLocationMap;
