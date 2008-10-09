<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';

header("Content-type: application/octet-stream");
header("Content-Disposition: attachment; filename=registration.csv");
header("Pragma: no-cache");
header("Expires: 0");

ob_start();
require( '_header.php' );
ob_end_clean();


analyseChoices();
generateSheet();

#----------------------------------------------------------------------
function analyseChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $separator;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $separator = getNormalParam( 'sep' );

}

#----------------------------------------------------------------------
function generateSheet () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $separator;

  $cr = "\n";

  $sep = ( $separator == 'comma' ) ? ',' : ';';

  $results = dbQuery("SELECT * FROM Preregs WHERE competitionId = '$chosenCompetitionId'");

  $competition = getFullCompetitionInfos( $chosenCompetitionId);

  $file = "$sep$sep$sep$sep$sep";

  foreach( getAllEvents() as $event ){
    extract( $event );

    if( preg_match( "/(^| )$id\b(=(\d+)\/(\d+:\d+))?/", $competition['eventSpecs'], $matches )){
      $eventIds[] = $id;
      $file .= "$sep$id";
    }
  }

  $file .= $cr;											  


  foreach( $results as $result ){

    extract( $result );
    $file .= "$name$sep$countryId$sep$personId$sep$birthYear-$birthMonth-$birthDay$sep$gender$sep";
    foreach( $eventIds as $eventId ){
      $offer = $result["E$eventId"];
      $file	.= "$sep$offer";
    }
    $file .= $cr;

  }

  echo $file;

}

?>
