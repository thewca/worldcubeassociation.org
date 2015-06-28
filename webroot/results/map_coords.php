<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
$mapsAPI = true;
require( 'includes/_header.php' );

if($is_admin) {
  adminHeadline('Edit competition Coordinates');
}

analyzeChoices();
if( checkCompetition() ){
  saveCoords();
  showMap();
}

require( 'includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;
  global $chosenLatitude, $chosenLongitude;
  global $chosenSave;

  $chosenCompetitionId = getNormalParam(  'competitionId' );
  $chosenPassword      = getNormalParam(  'password'      );
  $chosenLatitude      = round(getMysqlParam(   'latitude'      )*1000000);
  $chosenLongitude     = round(getMysqlParam(   'longitude'     )*1000000);
}


#----------------------------------------------------------------------
function checkCompetition () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $data;

  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );

  #--- Check the competitionId.
  if( count( $results ) != 1){
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  $data = $results[0];

  #--- Check the password.
  if(( $chosenPassword != $data['organiserPassword'] ) && ( $chosenPassword != $data['adminPassword'] )){
    showErrorMessage( "wrong password" );
    return false;
  }

  return true;
}

#----------------------------------------------------------------------
function saveCoords () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $data;
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
  global $chosenCompetitionId, $data;
  global $chosenLatitude, $chosenLongitude, $chosenPassword;
  $latitude = $longitude = 0;


  // WHOO MICRODEGREES
  // change this to degrees...
  if( $chosenLatitude && $chosenLongitude ){
    $latitude = $chosenLatitude / 1000000;
    $longitude = $chosenLongitude / 1000000;
  }
  if( $data['latitude'] != 0 or $data['longitude'] != 0 ){
    $latitude =  ($data['latitude']  / 1000000);
    $longitude = ($data['longitude'] / 1000000);
  }

  if($data['cityName'] || $data['venueAddress'] || $data['countryId'] || $data['venue']) {
    $address = preg_replace( '/ \[ \{ ([^]]*) \} \{ ([^]]*) \} \] /x', '$1', htmlEntities( $data['venue'], ENT_QUOTES ));
    if( isset($data['venueAddress']) ) $address .= ", " . htmlEntities( $data['venueAddress'], ENT_QUOTES);
    $address .= ", " . htmlEntities( $data['cityName'], ENT_QUOTES) . ", ".$data['countryId'];
  } else {
    $address = "";
  }

  echo "<p>You can search for a location using the map input field below, or drag the marker to a location.  Make sure to save any changes!</p>";
  echo "<hr />";

  displayGeocode($address, $latitude, $longitude);

  echo "<p><a href='competition_edit.php?competitionId=$chosenCompetitionId&password=$chosenPassword&rand=" . rand() . "'>Back</a> to editing $chosenCompetitionId<br />(don't forget to save first)</p>\n";

}
