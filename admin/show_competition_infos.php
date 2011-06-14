<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
require( '../competition_infos.php' );
adminHeadline( 'Show competition infos' );
showDescription();
showCompetitions();
require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>This shows the competition details as they're shown on the single competition pages, but all of them on one page in order to detect mistakes more easily.</p><hr />\n";
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
