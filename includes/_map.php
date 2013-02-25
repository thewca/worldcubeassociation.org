<?

function displayMap ( $width, $height ){
  initMap ( $width, $height );
  initMarkers ();
  addMarkers ();
}

function displayGeocode ( $width, $height, $address, $latitude, $longitude ){
 global $chosenCompetitionId, $chosenPassword;
?>
    <form method="GET">
    Address : <input type="text" id="add" name="add" value="<?php echo $address ?>" size="100" />
    <input type="button" name="search" value="Search" onclick="showLocation()" />
<?
  initMap( $width, $height );
  initGeocode ($latitude, $longitude);
?>
    <input type="hidden" name="competitionId" value="<?php echo $chosenCompetitionId ?>" />
    <input type="hidden" name="password" value="<?php echo $chosenPassword ?>" />
    <input type="hidden" name="rand" value="<?php echo rand() ?>" />
    Latitude : <input type="text" id="latitude" name="latitude" value="" size="20" />
    Longitude : <input type="text" id="longitude" name="longitude" value="" size="20" />
    <input type="submit" name="save" value="Save" />
    </form>
<?
}

function initGeocode ( $latitude, $longitude ){
?>
  var geocoder = new CM.Geocoder('b367992b0094416eae5409ac153d146f');
  var marker = new CM.Marker( new CM.LatLng(<?php echo $latitude ?>, <?php echo $longitude ?>), { title: 'Competition', draggable: true });
  CM.Event.addListener( marker, 'dragend', fillForm );
  map.addOverlay(marker);

  function fillForm() {
    var latlen = marker.getLatLng();
    document.forms[0].latitude.value = parseInt( latlen.lat() * 1000000 );
    document.forms[0].longitude.value = parseInt( latlen.lng() * 1000000 );
  }

  function addAddressToMap(response) {
    var coords = response.features[0].centroid.coordinates;
    marker.setLatLng( new CM.LatLng(coords[0], coords[1]) );
    fillForm();
  }

  function showLocation() {
    var address = document.forms[0].add.value;
    geocoder.getLocations(address, addAddressToMap);
  }

  </script>

<?
}


function initMap ( $width, $height ) {
  global $chosenRegionId;
  $width = ($width == 0) ? "100%" : "${width}px";
  echo "<div id='map' style='width: $width; height: ${height}px'></div>\n";

?>
  <script type="text/javascript" src="http://tile.cloudmade.com/wml/latest/web-maps-lite.js"></script>
  <script type="text/javascript">
    var cloudmade = new CM.Tiles.CloudMade.Web({key: 'b367992b0094416eae5409ac153d146f'});
    var map = new CM.Map('map', cloudmade);
    map.addControl(new CM.LargeMapControl());

<?

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

?>
