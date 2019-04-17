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
import { redMarker, blueMarker } from './markers';
import { GeoSearchControl } from 'leaflet-geosearch';
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
    .then(function(allResults) {
      if (allResults.length > 0) {
        // Assume first result will be ok
        let result = allResults[0];
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
          .setContent("No location found for your query. Try with GPS coordinates.")
          .openOn(map);
      }
    });
}

// Create a search input, removing any marker/popup added: we'll handle this ourselves
// with the existing marker
wca.createSearchInput = map => {
  let searchControl = new GeoSearchControl({
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
  let map = new LeafletMap(elementId, {
    zoom: 2,
    center: center,
    scrollWheelZoom: false,
  });
  let provider = userTileProvider;
  let layer = new TileLayer(provider.url, {
    maxZoom: 19,
    attribution: provider.attribution,
  });
  layer.addTo(map);
  if (iframeTrick) {
    // We create an invisible iframe that triggers an invalidate size when
    // resized (which includes bootstrap's collapse/hide/show events).
    let iframe = $('<iframe src="about:blank" class="invisible-iframe-map" />');

    $(`#${elementId}`).append(iframe);

    iframe.ready(() => {
      iframe[0].contentWindow.addEventListener("resize", () => {
        map.invalidateSize();
      });
      map.invalidateSize();
    });
  }
  return map;
};

wca.removeMapMarkersLeaflet = (map) => {
  map.eachLayer(layer => {
    if (layer instanceof Marker) {
      map.removeLayer(layer);
    }
  });
};

wca.addCompetitionsToMapLeaflet = function(map, competitions) {
  competitions.forEach(function(c) {
    let iconImage;
    if (c.is_probably_over) {
      iconImage = blueMarker;
    } else {
      iconImage = redMarker;
    }

    let competitionDesc = "<a href=" + c.url + ">" + c.name + "</a><br />" + c.marker_date + " - " + c.cityName;
    let marker = new Marker({
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
  return Math.trunc(parseFloat(val)*1e6) / 1e6;
}

var nearbyCompetitionsById = {};


wca.setupVenueMap = (elem, $lat, $lng, radiusDangerKm, radiusWarningKm, disabled) => {
  nearbyCompetitionsById = {};
  let map = wca.createCompetitionsMapLeaflet(elem, [0,0], false);
  wca._venue_map = map;
  let latLng = { lat: $lat.val(), lng: $lng.val() };
  // Create warning and danger circles
  let circleDanger = new Circle(latLng, {
    radius: radiusDangerKm * 1000,
    fill: false,
    color: '#d9534f', // @brand-danger
  }).addTo(map);
  let circleWarning = new Circle(latLng, {
    radius: radiusWarningKm * 1000,
    fill: false,
    color: '#f0ad4e', // @brand-warning
  }).addTo(map);
  // Create competition marker
  let compMarker = new Marker(latLng, {
    draggable: !disabled,
  }).addTo(map);
  let updateElementsPositions = () => {
    let newPos = compMarker.getLatLng();
    circleDanger.setLatLng(newPos);
    circleWarning.setLatLng(newPos);
    $lat.val(roundToMicrodegrees(newPos.lat));
    $lng.val(roundToMicrodegrees(newPos.lng));
    map.panTo(newPos);
    wca.fetchNearbyCompetitions();
  };

  let inputChangeHandler = () => {
    $lat.val(roundToMicrodegrees($lat.val()));
    $lng.val(roundToMicrodegrees($lng.val()));
    compMarker.setLatLng({
      lat: $lat.val(),
      lng: $lng.val(),
    });
    // Elements position will be updated by the "move" handler
  }
  let updateOnExternalChange = ev => {
    if (ev.originalEvent) {
      // This filters out mouse event, that are handled ondragend
      return;
    }
    updateElementsPositions();
  }
  // Takes care of changes through setLatLng (change in input, or search result)
  compMarker.on('move', updateOnExternalChange);
  compMarker.on('dragend', updateElementsPositions);
  $lat.change(inputChangeHandler);
  $lng.change(inputChangeHandler);
  // Center the view
  map.setView(latLng, 8);
  map.zoomControl.setPosition("topright");
  if (!disabled) {
    wca.createSearchInput(map);
    let handleGeoSearchResult = (result) => {
      compMarker.setLatLng({
        lat: result.location.y,
        lng: result.location.x,
      });
      compMarker.bindPopup(result.location.label).openPopup()
    }
    map.on('geosearch/showlocation', handleGeoSearchResult);
  }
  return map;
}

wca.setNearbyCompetitions = (nearbyCompetitions) => {
  let map = wca._venue_map;
  let desiredNearbyCompetitionById = _.keyBy(nearbyCompetitions, 'id');

  let desiredIds = Object.keys(desiredNearbyCompetitionById);
  let currentIds = Object.keys(nearbyCompetitionsById);
  let idsToAdd = _.difference(desiredIds, currentIds);
  let idsToRemove = _.difference(currentIds, desiredIds);

  // First, remove all uneeded markers.
  idsToRemove.forEach(id => {
    map.removeLayer(nearbyCompetitionsById[id].marker);
    delete nearbyCompetitionsById[id];
  });


  // Now create all the new markers.
  idsToAdd.forEach(id => {
    let c = desiredNearbyCompetitionById[id];
    c.marker = new Marker({
      lat: c.latitude_degrees,
      lng: c.longitude_degrees,
    }, {
      title: c.name,
    }).addTo(map);
    nearbyCompetitionsById[id] = c;
  });
}
