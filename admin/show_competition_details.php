<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
adminHeadline( 'Show competition details' );
showDescription();
showCompetitionDetails();
require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>This compactly lists details of all competitions, in order to detect mistakes more easily.</p><hr />\n";
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
