<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '../_header.php' );

analyzeChoices();
if( checkCompetition() ){ 
  saveCoords();
  showMap();
}

require( '../_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;
  global $chosenLatitude, $chosenLongitude;
  global $chosenSave;

  $chosenCompetitionId = getNormalParam(  'competitionId' );
  $chosenLatitude      = getMysqlParam(   'latitude'      );
  $chosenLongitude     = getMysqlParam(   'longitude'     );
}


#----------------------------------------------------------------------
function checkCompetition () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $data;

  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );

  #--- Check the competitionId.
  if( count( $results ) != 1){
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  $data = $results[0];

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

  echo "<center>\n";
$address = preg_replace( '/ \[ \{ ([^]]*) \} \{ ([^]]*) \} \] /x', '$1', htmlEntities( $data['venue'], ENT_QUOTES ));
if( $data['venueAddress'] ) $address .= ", " . htmlEntities( $data[venueAddress], ENT_QUOTES);
$address .= ", " . htmlEntities( $data[cityName], ENT_QUOTES) . ", $data[countryId]";

  displayGeocode( 800, 480, $address, $latitude, $longitude );

  echo "<p><a href='competition_edit.php?competitionId=$chosenCompetitionId&amp;rand=" . rand() . "'>Back</a> to editing $chosenCompetitionId<br />(don't forget to save first)</p>\n";
  ?>
    </center>
  </body>
</html>

<?

}

?>
