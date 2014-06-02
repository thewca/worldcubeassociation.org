<?php

/**
 * Google maps: create list of markers.
 */

function displayMap($markers){
  ?>
<div id='map-canvas' style='width: 900px; height: 400px; margin: 10px auto;'></div>
<script type="text/javascript">

function initialize() {

  /* create and center map */
  var map = new google.maps.Map(document.getElementById('map-canvas'), {
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  var defaultBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(-45, -90),
    new google.maps.LatLng(45, 90)
  );
  map.fitBounds(defaultBounds);

  // Nearby markers should spider
  var oms = new OverlappingMarkerSpiderfier(map, {
    keepSpiderfied: true
  });

  // for making markers
  function createMarker(lat, lng, info, oms) {
    var infowindow = new google.maps.InfoWindow({
      content: info
    });
    var latLng = new google.maps.LatLng(lat, lng);
    var marker = new google.maps.Marker({
      position: latLng,
      map: map
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map,marker);
    });

    oms.addMarker(marker);

    return marker;
  }

  // make all the markers
  var markers = [];
  <?php foreach($markers as $marker){ ?>
    markers.push(createMarker(
      <?php print $marker['latitude']/1000000; ?>,
      <?php print $marker['longitude']/1000000; ?>,
      "<?php print $marker['info']; /* can be HTML, but can't have double-quotes */ ?>",
      oms
    ));    
  <?php } ?>
  var markerCluster = new MarkerClusterer(map, markers, {
    maxZoom: 10,
    clusterSize: 30
  });

}

google.maps.event.addDomListener(window, 'load', initialize);

</script>

<?php
}




/**
 * Google maps: search for location coordinates
 */
function displayGeocode($address, $lat, $lng) {
  global $chosenCompetitionId, $chosenPassword;
?>

<div id='map-canvas' style='width: 900px; height: 400px; margin: 10px auto;'></div>
<input id="pac-input" autofocus="autofocus" class="controls" type="text" placeholder="Search Box" value="<?php print o($address); ?>" style='width: 500px; height: 20px; font-size: 16px; padding: 5px; margin: 10px;'>

<script>
function initialize() {

  var map = new google.maps.Map(document.getElementById('map-canvas'), {
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  var searchBox = new google.maps.places.SearchBox(input);

  var image = {
    url: "http://soliton.case.edu/wca/results/wca-website/images/violet-dotp.png",
    size: new google.maps.Size(20, 34),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(10, 34),
    scaledSize: new google.maps.Size(20, 34)
  };

  // create the marker
  <?php if($lat*1 && $lng*1) { ?>
    // Coordinates have already been specified
    var latlng = new google.maps.LatLng({
      lat: <?php print number_format($lat,9,'.',''); ?>,
      lng: <?php print number_format($lng,9,'.',''); ?>
    });
    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      draggable: true,
      position: {lat: <?php print number_format($lat,9,'.',''); ?>, lng: <?php print number_format($lng,9,'.',''); ?>}
    });
    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(<?php print number_format($lat,9,'.',''); ?>-.1, <?php print number_format($lng,9,'.',''); ?>-.1),
      new google.maps.LatLng(<?php print number_format($lat,9,'.',''); ?>+.1, <?php print number_format($lng,9,'.',''); ?>+.1)
    );

  <?php } else { ?>

    // Coordinates have not been specified
    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      draggable: true,
      position: {lat: 0, lng: 0}
    });
    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-60, -90),
      new google.maps.LatLng(60, 90)
    );

    <?php if($address) { ?>
      // Perform an initial search using the existing address
      var request = {
        query: '<?php print o($address); ?>'
      };
      var service = new google.maps.places.PlacesService(map);
      service.textSearch(request, function(places, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          if(places.length > 0) {
            marker.setPosition(places[0].geometry.location);
          }
        }
      });
    <?php } ?>

  <?php } ?>
  map.fitBounds(defaultBounds);

  // Have the marker listen for changes to the place.
  google.maps.event.addListener(marker, 'dragend', function() {
    document.getElementById('latitude').value = this.getPosition().lat();
    document.getElementById('longitude').value = this.getPosition().lng();
  });

  // [START region_getplaces]
  // Listen for the event fired when the user selects an item from the
  // pick list. Retrieve the matching places for that item.
  google.maps.event.addListener(searchBox, 'places_changed', function() {
    // Only use the first place - get the icon, place name, and location.
    var places = searchBox.getPlaces();
    var place = places[0];
    
    marker.setPosition(place.geometry.location);
    map.panTo(place.geometry.location);
    map.setZoom(12);

    document.getElementById('latitude').value = place.geometry.location.lat();
    document.getElementById('longitude').value = place.geometry.location.lng();
  });
  // [END region_getplaces]

  // Bias the SearchBox results towards places that are within the bounds of the
  // current map's viewport.
  google.maps.event.addListener(map, 'bounds_changed', function() {
    var bounds = map.getBounds();
    searchBox.setBounds(bounds);
  });
}

google.maps.event.addDomListener(window, 'load', initialize);

</script>

<form method="post">
    <input type="hidden" name="competitionId" value="<?php print o($chosenCompetitionId); ?>" />
    <input type="hidden" name="password" value="<?php print o($chosenPassword); ?>" />
    <input type="hidden" name="rand" value="<?php echo rand(); ?>" />
    Latitude : <input type="text" id="latitude" name="latitude" value="<?php print number_format($lat,9,'.',''); ?>" size="20" />
    Longitude : <input type="text" id="longitude" name="longitude" value="<?php print number_format($lng,9,'.',''); ?>" size="20" />
    <input type="submit" name="save" value="Save" />
    </form>

<?php
}
