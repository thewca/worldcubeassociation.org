<?php

/* old CM functionality */

function displayMap ( $width, $height ){
  initMap ( $width, $height );
  initMarkers ();
  addMarkers ();
}

function initMap ( $width, $height ) {
  global $chosenRegionId;
  $width = ($width == 0) ? "100%" : "${width}px";
  echo "<div id='map' style='width: $width; height: ${height}px'></div>\n";

?>
  <script type="text/javascript" src="https://ssl_tiles.cloudmade.com/wml/latest/web-maps-lite.js"></script>
  <script type="text/javascript">
    var cloudmade = new CM.Tiles.CloudMade.Web({key: 'b367992b0094416eae5409ac153d146f'});
    var map = new CM.Map('map', cloudmade);
    map.addControl(new CM.LargeMapControl());

<?php

$coords['latitude'] = 20000000;
$coords['longitude'] = 8000000;
$coords['zoom'] = 2;

if( $chosenRegionId && $chosenRegionId != 'World' ){ 

  $continent = dbQuery("SELECT * FROM Continents WHERE id='$chosenRegionId' ");
  
  if( count( $continent ) && ( $continent[0]['zoom'] != 0 ))
    $coords = $continent[0];
  else {
    $country = dbQuery("SELECT * FROM Countries WHERE id='$chosenRegionId' ");
    if( count( $country ) && ( $country[0]['zoom'] != 0 ))
      $coords = $country[0];
  }
}

  $coords['latitude'] /= 1000000;
  $coords['longitude'] /= 1000000;
  echo "map.setCenter(new CM.LatLng($coords[latitude], $coords[longitude]), $coords[zoom]);";
}

function initMarkers (){

for( $i = 1; $i < 10; $i++ ){
  echo "var blueIcon$i = new CM.Icon();\n";
  echo "blueIcon$i.image = \"images/blue-dot$i.png\";\n";
  echo "blueIcon$i.iconSize = new CM.Size(20, 34);\n";
  echo "blueIcon$i.iconAnchor = new CM.Point(0, 30);\n";

  echo "var violetIcon$i = new CM.Icon();\n";
  echo "violetIcon$i.image = \"images/violet-dot$i.png\";\n";
  echo "violetIcon$i.iconSize = new CM.Size(20, 34);\n";
  echo "violetIcon$i.iconAnchor = new CM.Point(0, 30);\n";
}

echo "var blueIconp = new CM.Icon();\n";
echo "blueIconp.image = \"images/blue-dotp.png\";\n";
echo "blueIconp.iconSize = new CM.Size(20, 34);\n";
echo "blueIconp.iconAnchor = new CM.Point(0, 30);\n";

echo "var violetIconp = new CM.Icon();\n";
echo "violetIconp.image = \"images/violet-dotp.png\";\n";
echo "violetIconp.iconSize = new CM.Size(20, 34);\n";
echo "violetIconp.iconAnchor = new CM.Point(0, 30);\n";

}

function addMarkers (){
  global $chosenCompetitions;

  $isFirst = true;
  $countCompetitions = 0;
  $infosHtml = $pastVenue = '';
  foreach( $chosenCompetitions as $competition ){
    extract( $competition );

    if( $latitude != 0 or $longitude != 0){
      if( $isFirst ){
        $previousLatitude = $latitude;
        $previousLongitude = $longitude;
        $isFirst = false;
      }

      if( $latitude != $previousLatitude || $longitude != $previousLongitude ){
        $previousLatitude /= 1000000;
        $previousLongitude /= 1000000;

        $infosHtml .= $pastVenue;
        echo "marker.bindInfoWindow(\"$infosHtml\");\n";
        echo "map.addOverlay(marker);\n";

        $previousLatitude = $latitude;
        $previousLongitude = $longitude;

        $countCompetitions = 0;
        $infosHtml = "";

      }

      $infosHtml .= "<b>" . competitionLink( $id, $cellName ) . "</b> (" . competitionDate( $competition ) . ", $year)<br/>";
      $pastVenue = processLinks( htmlEntities( $venue , ENT_QUOTES, "UTF-8" ));

      $latitude /= 1000000;
      $longitude /= 1000000;
      $countCompetitions++;
      $cc = $countCompetitions;
      if( $cc > 9 ) $cc = 'p';
      echo "var point = new CM.LatLng($latitude, $longitude);\n";
      if( date( 'Ymd' ) > (10000*$year + 100*$month + $day) )
        echo "var marker = new CM.Marker(point, { icon:blueIcon$cc });\n";
      else
        echo "var marker = new CM.Marker(point, { icon:violetIcon$cc });\n";
    }
  }

  $infosHtml .= $pastVenue;
  echo "marker.bindInfoWindow(\"$infosHtml\");\n";
  echo "map.addOverlay(marker);\n";

  echo "</script>";
}




/* new google maps functionality*/

function displayGeocode($address, $latitude, $longitude) {
  global $chosenCompetitionId, $chosenPassword;

  $lat = $latitude; $lng = longitude;

?>

<div id='map-canvas' style='width: 900px; height: 400px; margin: 10px auto;'></div>
<input id="pac-input" class="controls" type="text" placeholder="Search Box" value="<?php print o($address); ?>" style='width: 500px; height: 20px; font-size: 16px; padding: 5px; margin: 10px;'>

<script>
function initialize() {

  var map = new google.maps.Map(document.getElementById('map-canvas'), {
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  var image = {
    url: "http://soliton.case.edu/wca/results/wca-website/images/violet-dotp.png",
    size: new google.maps.Size(20, 34),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(10, 34),
    scaledSize: new google.maps.Size(20, 34)
  };

  <?php if($lat*1 && $lng*1) { ?>
    var latlng = new google.maps.LatLng({
      lat: <?php print o($lat*1); ?>,
      lng: <?php print o($lng*1); ?>
    });
    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      draggable: true,
      position: {lat: <?php print o($lat*1); ?>, lng: <?php print o($lng*1); ?>}
    });
    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(<?php print o($lat*1); ?>-.1, <?php print o($lng*1); ?>-.1),
      new google.maps.LatLng(<?php print o($lat*1); ?>+.1, <?php print o($lng*1); ?>+.1));

  <?php } else { ?>
    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      draggable: true
    });
    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-45, -90),
      new google.maps.LatLng(45, 90));
  <?php } ?>
  map.fitBounds(defaultBounds);

  // Create the search box and link it to the UI element.
  var input = /** @type {HTMLInputElement} */(
      document.getElementById('pac-input'));
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  var searchBox = new google.maps.places.SearchBox(
    /** @type {HTMLInputElement} */(input));

  // Create a marker for the place.
  var place;
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
    var bounds = new google.maps.LatLngBounds();
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
    <input type="hidden" name="competitionId" value="<?php echo $chosenCompetitionId ?>" />
    <input type="hidden" name="password" value="<?php echo $chosenPassword ?>" />
    <input type="hidden" name="rand" value="<?php echo rand(); ?>" />
    Latitude : <input type="text" id="latitude" name="latitude" value="<?php print o($latitude*1); ?>" size="20" />
    Longitude : <input type="text" id="longitude" name="longitude" value="<?php print o($longitude*1); ?>" size="20" />
    <input type="submit" name="save" value="Save" />
    </form>

<?php
}
