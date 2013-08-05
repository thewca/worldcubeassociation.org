<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( 'includes/_header.php' );

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
  $chosenLatitude      = getMysqlParam(   'latitude'      );
  $chosenLongitude     = getMysqlParam(   'longitude'     );
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

  echo "<center>\n";
$address = preg_replace( '/ \[ \{ ([^]]*) \} \{ ([^]]*) \} \] /x', '$1', htmlEntities( $data['venue'], ENT_QUOTES ));
if( $data['venueAddress'] ) $address .= ", " . htmlEntities( $data[venueAddress], ENT_QUOTES);
$address .= ", " . htmlEntities( $data[cityName], ENT_QUOTES) . ", $data[countryId]";

  displayGeocode( 800, 480, $address, $latitude, $longitude );

  echo "<p><a href='competition_edit.php?competitionId=$chosenCompetitionId&password=$chosenPassword&rand=" . rand() . "'>Back</a> to editing $chosenCompetitionId<br />(don't forget to save first)</p>\n";
  ?>
    </center>
  </body>
</html>

<?

}

?>
