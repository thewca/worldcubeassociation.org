<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
require( '../competition_infos.php' );
showDescription();
showCompetitions();
require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script does *not* affect the database.<br><br>It shows the competition details as they'd be shown on the single competition pages, but all of them on one page in order to detect mistakes more easily.</b></p><hr>";
}

#----------------------------------------------------------------------
function showCompetitions () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $competitionResults;

  foreach( dbQuery( "SELECT id FROM Competitions ORDER BY year, month, day" ) as $competition ){
    $chosenCompetitionId = $competition['id'];
    $competitionResults = dbQuery( "SELECT * FROM Results WHERE competitionId = '$chosenCompetitionId'" );
    echo "<hr>";
    echo competitionLink( $chosenCompetitionId, $chosenCompetitionId );
    showCompetitionInfos();
  }
}

?>
