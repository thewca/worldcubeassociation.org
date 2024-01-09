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
  const updatePosition = useCallback((e) => setPosition(e, e.target.getLatLng()), [setPosition]);

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

function ResizeMapIFrame() {
  const map = useMap();
  const iframeRef = useRef();

  const onResizeAction = useCallback(() => map.invalidateSize(false), [map]);

  useEffect(() => {
    const iframeNode = iframeRef.current;

    iframeNode.contentWindow.addEventListener('resize', onResizeAction);

    return () => {
      iframeNode.contentWindow.removeEventListener('resize', onResizeAction);
    };
  }, [iframeRef, onResizeAction]);

  return (
    <iframe
      title="invisibleIFrame"
      src="about:blank"
      className="invisible-iframe-map"
      ref={iframeRef}
    />
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

  const mapPosition = useMemo(() => ({
    lat: toDegrees(venue.latitudeMicrodegrees),
    lng: toDegrees(venue.longitudeMicrodegrees),
  }), [venue.latitudeMicrodegrees, venue.longitudeMicrodegrees]);

  const setMapPosition = useCallback((evt, { lat, lng }) => {
    dispatch(editVenue(venue.id, 'latitudeMicrodegrees', toMicrodegrees(lat)));
    dispatch(editVenue(venue.id, 'longitudeMicrodegrees', toMicrodegrees(lng)));
  }, [dispatch, venue.id]);

  const provider = userTileProvider;

  const onGeoSearchResult = useCallback((evt) => {
    setMapPosition(evt, {
      lat: evt.location.y,
      lng: evt.location.x,
    });

    setSearchResultPopup(evt.location.label);
  }, [setMapPosition, setSearchResultPopup]);

  return (
    <MapContainer
      center={mapPosition}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: '100%' }}
    >
      <ResizeMapIFrame />
      <TileLayer url={provider.url} attribution={provider.attribution} />
      <GeoSearchControl onGeoSearchResult={onGeoSearchResult} />
      <DraggableMarker markerRef={markerRef} position={mapPosition} setPosition={setMapPosition}>
        {markerPopup}
      </DraggableMarker>
    </MapContainer>
  );
}

export default VenueLocationMap;
