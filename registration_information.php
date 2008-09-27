<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '_header.php' );

analyzeChoices();
showInformation();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
}

#----------------------------------------------------------------------
function showInformation () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  $results = dbQuery("SELECT * FROM Preregs WHERE competitionId='$chosenCompetitionId'");

  echo "<pre>";
  print_r( $results );
  echo "</pre>";

}

?>
