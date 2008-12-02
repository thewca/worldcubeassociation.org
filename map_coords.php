<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
ob_start(); require( '_framework.php' ); ob_end_clean();

analyzeChoices();
if( checkPassword() ){ 
  saveCoords();
  showMap();
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;
  global $chosenLatitude, $chosenLongitude;
  global $chosenSave;

  $chosenCompetitionId = getNormalParam(  'competitionId' );
  $chosenPassword      = getNormalParam(  'password'      );
  $chosenLatitude      = getMysqlParam(   'latitude'      );
  $chosenLongitude     = getMysqlParam(   'longitude'     );
}


#----------------------------------------------------------------------
function checkPassword () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $data;

  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );

  #--- Check the competitionId.
  if( count( $results ) != 1){
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  #--- Check the password.
  $data = $results[0];

  if( $chosenPassword != $data['password'] ){
    showErrorMessage( "wrong password" );
    return false;
  }

  return true;
}

#----------------------------------------------------------------------
function saveCoords () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $data;
  global $chosenLatitude, $chosenLongitude;
  global $chosenSave;

  if( $chosenLatitude && $chosenLongitude ) 
  dbCommand( "UPDATE Competitions
                SET latitude='$chosenLatitude',
                    longitude='$chosenLongitude'
                WHERE id='$chosenCompetitionId'" );


}

#----------------------------------------------------------------------
function showMap () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $data;
  global $chosenLatitude, $chosenLongitude;

  if( $chosenLatitude && $chosenLongitude ){
    $latitude =  $chosenLatitude / 1000000;
    $longitude = $chosenLongitude / 1000000;
  }
  else if( $data['latitude'] != 0 or $data['longitude'] != 0 ){
    $latitude =  ($data['latitude']  / 1000000);
    $longitude = ($data['longitude'] / 1000000);
  }
  else{
    $latitude = 32.855293;
    $longitude = -117.259605;
  }

?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
  <head>
    <title>World Cube Association - Official Results</title>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
    <meta name="author" content="Stefan Pochmann, Josef Jelinek" />
    <meta name="description" content="Official World Cube Association Competition Results" />
    <meta name="keywords" content="rubik's cube,puzzles,competition,official results,statistics,WCA" />
    <link rel="shortcut icon" href="images/wca.ico" />
    <link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/general.css" />
    <link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/links.css" />
    <script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAAGU1lxRKjKY2msINWGWVpGBQbYy8YqffdsRVCI9c6jAKj6rG0nxSHbmoN9OgZk4LBxdzm88fVVb-Ncg" type="text/javascript"></script>
    <script type="text/javascript">
    var geocoder;
	 var center;
	 var marker;
    var map;

    function load() {
      if (GBrowserIsCompatible()) {
        map = new GMap2(document.getElementById("map"));
        map.addControl(new GSmallMapControl());
        map.addControl(new GMapTypeControl());
        //map.addControl(new GOverviewMapControl());
        map.setCenter(new GLatLng(20, 8), 2);
        geocoder = new GClientGeocoder();
        center = new GLatLng(<?php echo $latitude ?>, <?php echo $longitude ?>);
        marker = new GMarker(center, {draggable: true});
        GEvent.addListener(marker, "dragend", fillForm);
        map.addOverlay(marker);

      }
    }

    function fillForm() {
      var latlen = new GLatLng(0, 0);
      latlen = marker.getLatLng();
      document.forms[0].latitude.value = parseInt( latlen.lat() * 1000000 );
      document.forms[0].longitude.value = parseInt( latlen.lng() * 1000000 );
	 }


    function addAddressToMap(response) {
      map.clearOverlays();
      if (!response || response.Status.code != 200) {
        alert("Sorry, we were unable to geocode that address");
      } else {
        place = response.Placemark[0];
        point = new GLatLng(place.Point.coordinates[1],
        place.Point.coordinates[0]);
		  marker.setLatLng(point);
		  fillForm();
        map.addOverlay(marker);
      }
    }


    function showLocation() {
      var address = document.forms[0].add.value;
      geocoder.getLocations(address, addAddressToMap);
    }
    </script>
  </head>
  <body onload="load()" onunload="GUnload()">
  <center>
<?php
$address = preg_replace( '/ \[ \{ ([^]]*) \} \{ ([^]]*) \} \] /x', '$1', htmlEntities( $data['venue'], ENT_QUOTES ));
if( $data['venueAddress'] ) $address .= ", " . htmlEntities( $data[venueAddress], ENT_QUOTES);
$address .= ", " . htmlEntities( $data[cityName], ENT_QUOTES) . ", $data[countryId]";
?>


	 <form action="<?php echo $_SERVER['PHP_SELF'] ?>">
    Address : <input type="text" id="add" name="add" value="<?php echo $address ?>" size="100" />
    <input type="button" name="search" value="Search" onclick="showLocation()" />
    <div id="map" style="width: 800px; height: 480px"></div>
    <input type="hidden" name="competitionId" value="<?php echo $chosenCompetitionId ?>" />
    <input type="hidden" name="password" value="<?php echo $chosenPassword ?>" />
    <input type="hidden" name="rand" value="<?php echo rand() ?>" />
    Latitude : <input type="text" id="latitude" name="latitude" value="" size="20" />
    Longitude : <input type="text" id="longitude" name="longitude" value="" size="20" />
    <input type="submit" name="save" value="Save" />
    </form>
  </center>
  <?php
    echo "<a href='competition_edit.php?competitionId=$chosenCompetitionId&password=$chosenPassword'&rand=" . rand() . ">Back</a>";
  ?>
  </body>
</html>

<?php

}

?>
