<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';

header("Content-type: text/csv");
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
  global $chosenCompetitionId;

  $chosenCompetitionId = getNormalParam( 'competitionId' );

}

#----------------------------------------------------------------------
function generateSheet () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  $cr = "\n";

  $sep = ',';

  $results = dbQuery("SELECT * FROM Preregs WHERE competitionId = '$chosenCompetitionId'");

  $competition = getFullCompetitionInfos( $chosenCompetitionId);

  $file = "Status${sep}Name${sep}Country${sep}WCA ID${sep}Birth Date${sep}Gender$sep";

  foreach( getAllEvents() as $event ){
    extract( $event );

    if( preg_match( "/(^| )$id\b(=(\d+)\/(\d+:\d+))?/", $competition['eventSpecs'], $matches )){
      $eventIds[] = $id;
      $file .= "$sep$id";
    }
  }

  $file .= "${sep}Email${sep}Guests${sep}IP";
  $file .= $cr;


  foreach( $results as $result ){

    extract( $result );
    $guests = str_replace(array("\r\n", "\n", "\r", ","), ";", $guests);
    $file .= "$status$sep$name$sep$countryId$sep$personId$sep$birthYear-$birthMonth-$birthDay$sep$gender$sep";
    foreach( $eventIds as $eventId ){
      $offer = $result["E$eventId"];
      $file	.= "$sep$offer";
    }
    $file .= "$sep$email$sep$guests$sep$ip";
    $file .= $cr;

  }

  echo $file;

}

?>
