<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
showDescription();
showCompetitionDetails();
require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script does *not* affect the database.<br /><br />It shows the competition details as they'd be shown on the single competition pages, but all of them on one page in order to detect mistakes more easily.</b></p><hr />\n\n";
}

#----------------------------------------------------------------------
function showCompetitionDetails () {
#----------------------------------------------------------------------

  $rows = dbQuery("
              SELECT id, year, 'organiser'   keey, organiser   value FROM Competitions
    UNION ALL SELECT id, year, 'venue'       keey, venue       value FROM Competitions
    UNION ALL SELECT id, year, 'wcaDelegate' keey, wcaDelegate value FROM Competitions
    UNION ALL SELECT id, year, 'website'     keey, website     value FROM Competitions
    UNION ALL SELECT id, year, 'information' keey, information value FROM Competitions
    ORDER BY keey, value, year
  ");

  echo "<table border='1' style='font-size:0.85em' cellspacing='0' cellpadding='4'>";
  foreach( $rows as $row ){
    extract( $row );

    if( $value ){
      echo "<tr><td>" . competitionLink( $id, $id ) . "</td>";
      echo "<td>" . htmlEscape( $keey ) . "</td>";
      echo "<td>" . processLinks( $value ) . "</td></tr>\n";
    }
  }

}

?>
