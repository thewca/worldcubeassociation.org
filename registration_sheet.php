<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';

header('Content-Encoding: UTF-8');
header("Content-type: text/csv; charset=UTF-8");
header("Content-Disposition: attachment; filename=registration.csv");
header("Pragma: no-cache");
header("Expires: 0");

ob_start();
require( 'includes/_header.php' );
ob_end_clean();


analyseChoices();
if( checkPassword() ) {
  generateSheet();
}

#----------------------------------------------------------------------
function analyseChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenPassword = getNormalParam( 'password' );

}

#----------------------------------------------------------------------
function checkPassword () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;

  #--- Load the competition data from the database.
  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );
  
  #--- Check the competitionId.
  if( count( $results ) != 1 ){
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  #--- Competition exists, so get its data.
  $data = $results[0];

  #--- Check the password.
  if(( $chosenPassword != $data['organiserPassword'] ) && ( $chosenPassword != $data['adminPassword'] )){
    showErrorMessage( "wrong password" );
    return false;
  }

  return true;
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

  $eventIdsList = getEventSpecsEventIds( $competition['eventSpecs'] );
  foreach( $eventIdsList as $eventId )
    $file .= "$sep$eventId";

  $file .= "${sep}Email${sep}Guests${sep}IP";
  $file .= $cr;


  foreach( $results as $result ){

    extract( $result );
    $guests = str_replace(array("\r\n", "\n", "\r", ","), ";", $guests);
    $file .= "$status$sep$name$sep$countryId$sep$personId$sep$birthYear-$birthMonth-$birthDay$sep$gender$sep";
    $eventIdsPerson = array_flip( explode( ' ', $eventIds ));
    foreach( $eventIdsList as $eventId ){
      $offer = isset( $eventIdsPerson[$eventId] )?1:0 ;
      $file .= "$sep$offer";
    }
    $file .= "$sep$email$sep$guests$sep$ip";
    $file .= $cr;

  }

  echo $file;

}

?>
