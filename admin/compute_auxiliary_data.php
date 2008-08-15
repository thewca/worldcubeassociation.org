<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$dontLoadCachedDatabase = true;

require( '../_header.php' );
require( '_helpers.php' );
showDescription();
computeConciseRecords();
computeCachedDatabase('../cachedDatabase.php');
require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script *does* affect the database.<br><br>It computes the auxiliary tables ConciseSingleResults and ConciseAverageResults. It must be run after changes to the database data so that these tables are up-to-date. It displays the time so you can be sure it just got executed and didn't come from some cache.</b></p><hr>";
}

#----------------------------------------------------------------------
function computeConciseRecords () {
#----------------------------------------------------------------------

  echo date('l dS \of F Y h:i:s A') . "<br /><br />\n";

  foreach( array( array( 'best', 'Single' ), array( 'average', 'Average' )) as $foo ){
    $valueSource = $foo[0];
    $valueName = $foo[1];

    startTimer();
    echo "Building table Concise${valueName}Records...<br />\n";
    dbCommand( "DROP TABLE IF EXISTS Concise${valueName}Results" );
    dbCommand("
      CREATE TABLE
        Concise${valueName}Results
      SELECT
        result.id,
        $valueSource,
        ($valueSource * 1000000000 + result.id) valueAndId,
        personId,
        eventId,
        country.id countryId,
        continentId,
        year, month, day
      FROM
        (SELECT * FROM Results WHERE $valueSource>0 ORDER BY $valueSource) result,
        Competitions competition,
        Countries    country
      WHERE 1
        AND competition.id = competitionId
        AND country.id     = result.countryId
      GROUP BY
        personId, eventId, year
      ORDER BY
        $valueSource DESC, personName
    ");
    echo "... done<br /><br />\n";

    stopTimer( "blah" );
  }
}


?>
