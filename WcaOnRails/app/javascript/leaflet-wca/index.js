import 'leaflet/dist/leaflet.css';
// https://github.com/smeijer/leaflet-geosearch/issues/151#issuecomment-347967474
import 'leaflet-geosearch/assets/css/leaflet.css';
import {
  Map as LeafletMap,
  TileLayer,
  Marker,
  Circle,
  Popup,
  Icon,
} from 'leaflet';
import { GeoSearchControl } from 'leaflet-geosearch';
import railsEnv from 'wca/rails-env.js.erb';
import { redMarker, blueMarker } from './markers';
import { searchProvider, userTileProvider } from './providers.js';

// Leaflet and webpacker are not good friend, we need to require the images for
// the assets to be properly setup.
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

wca.searchAndPlaceOnMap = (map, query) => {
  searchProvider
    .search({ query })
    .then((allResults) => {
      if (allResults.length > 0) {
        // Assume first result will be ok
        const result = allResults[0];
        new Marker({
          lat: result.y,
          lng: result.x,
        }, {
          title: result.label,
        }).addTo(map).bindPopup(result.label).openPopup();
        map.setView([result.y, result.x], 16);
      } else {
        new Popup()
          .setLatLng([0, 0])
          .setContent('No location found for your query. Try with GPS coordinates.')
          .openOn(map);
      }
    });
};

// Create a search input, removing any marker/popup added: we'll handle this ourselves
// with the existing marker
wca.createSearchInput = (map) => {
  const searchControl = new GeoSearchControl({
    provider: searchProvider,
    showMarker: false,
    showPopup: false,
    style: 'bar',
    retainZoomLevel: true,
    autoClose: true,
    searchLabel: 'Enter an address',
  });
  map.addControl(searchControl);
};

wca.createCompetitionsMapLeaflet = (elementId, center = [0, 0], iframeTrick = true) => {
  const map = new LeafletMap(elementId, {
    zoom: 2,
    center,
  });
  const provider = userTileProvider;
  const layer = new TileLayer(provider.url, {
    maxZoom: 19,
    attribution: provider.attribution,
  });
  // To avoid timeout issue on *.tile.openstreetmap.org during tests,
  // we don't add the actual tile layer in that environment.
  if (railsEnv !== 'test') layer.addTo(map);
  if (iframeTrick) {
    // We create an invisible iframe that triggers an invalidate size when
    // resized (which includes bootstrap's collapse/hide/show events).
    const iframe = $('<iframe src="about:blank" class="invisible-iframe-map" />');

    $(`#${elementId}`).append(iframe);

    iframe.ready(() => {
      iframe[0].contentWindow.addEventListener('resize', () => {
        map.invalidateSize();
      });
      map.invalidateSize();
    });
  }
  return map;
};

wca.removeMapMarkersLeaflet = (map) => {
  map.eachLayer((layer) => {
    if (layer instanceof Marker) {
      map.removeLayer(layer);
    }
  });
};

wca.addCompetitionsToMapLeaflet = function (map, competitions) {
  competitions.forEach((c) => {
    let iconImage;
    if (c.is_probably_over) {
      iconImage = blueMarker;
    } else {
      iconImage = redMarker;
    }

    const competitionDesc = `<a href=${c.url}>${c.name}</a><br />${c.marker_date} - ${c.cityName}`;
    const marker = new Marker({
      lat: c.latitude_degrees,
      lng: c.longitude_degrees,
    }, {
      title: c.name,
      icon: iconImage,
    }).addTo(map).bindPopup(competitionDesc);
  });
};

function roundToMicrodegrees(val) {
  val = val || 0;
  // To prevent are you sure? from firing even when nothing has changed,
  // explicitly round coordinates to an integer number of microdegrees.
  return Math.trunc(parseFloat(val) * 1e6) / 1e6;
}

let nearbyCompetitionsById = {};


wca.setupVenueMap = (elem, $lat, $lng, radiusDangerKm, radiusWarningKm, disabled) => {
  nearbyCompetitionsById = {};
  const map = wca.createCompetitionsMapLeaflet(elem, [0, 0], false);
  wca._venue_map = map;
  const latLng = { lat: $lat.val(), lng: $lng.val() };
  // Create warning and danger circles
  const circleDanger = new Circle(latLng, {
    radius: radiusDangerKm * 1000,
    fill: false,
    color: '#d9534f', // @brand-danger
  }).addTo(map);
  const circleWarning = new Circle(latLng, {
    radius: radiusWarningKm * 1000,
    fill: false,
    color: '#f0ad4e', // @brand-warning
  }).addTo(map);
  // Create competition marker
  const compMarker = new Marker(latLng, {
    draggable: !disabled,
  }).addTo(map);
  const updateElementsPositions = () => {
    const newPos = compMarker.getLatLng();
    circleDanger.setLatLng(newPos);
    circleWarning.setLatLng(newPos);
    $lat.val(roundToMicrodegrees(newPos.lat));
    $lng.val(roundToMicrodegrees(newPos.lng));
    map.panTo(newPos);
    wca.fetchNearbyCompetitions();
  };

  const inputChangeHandler = () => {
    $lat.val(roundToMicrodegrees($lat.val()));
    $lng.val(roundToMicrodegrees($lng.val()));
    compMarker.setLatLng({
      lat: $lat.val(),
      lng: $lng.val(),
    });
    // Elements position will be updated by the "move" handler
  };
  const updateOnExternalChange = (ev) => {
    if (ev.originalEvent) {
      // This filters out mouse event, that are handled ondragend
      return;
    }
    updateElementsPositions();
  };
  // Takes care of changes through setLatLng (change in input, or search result)
  compMarker.on('move', updateOnExternalChange);
  compMarker.on('dragend', updateElementsPositions);
  $lat.change(inputChangeHandler);
  $lng.change(inputChangeHandler);
  // Center the view
  map.setView(latLng, 8);
  map.zoomControl.setPosition('topright');
  if (!disabled) {
    wca.createSearchInput(map);
    const handleGeoSearchResult = (result) => {
      compMarker.setLatLng({
        lat: result.location.y,
        lng: result.location.x,
      });
      compMarker.bindPopup(result.location.label).openPopup();
    };
    map.on('geosearch/showlocation', handleGeoSearchResult);
  }
  return map;
};

wca.setNearbyCompetitions = (nearbyCompetitions) => {
  const map = wca._venue_map;
  const desiredNearbyCompetitionById = _.keyBy(nearbyCompetitions, 'id');

  const desiredIds = Object.keys(desiredNearbyCompetitionById);
  const currentIds = Object.keys(nearbyCompetitionsById);
  const idsToAdd = _.difference(desiredIds, currentIds);
  const idsToRemove = _.difference(currentIds, desiredIds);

  // First, remove all uneeded markers.
  idsToRemove.forEach((id) => {
    map.removeLayer(nearbyCompetitionsById[id].marker);
    delete nearbyCompetitionsById[id];
  });


  // Now create all the new markers.
  idsToAdd.forEach((id) => {
    const c = desiredNearbyCompetitionById[id];
    c.marker = new Marker({
      lat: c.latitude_degrees,
      lng: c.longitude_degrees,
    }, {
      title: c.name,
    }).addTo(map);
    nearbyCompetitionsById[id] = c;
  });
};
