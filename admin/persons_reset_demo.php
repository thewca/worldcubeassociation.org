<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );

showDescription();
resetDemo();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script *DOES* affect the database.</b></p>";

  echo "<p>Somewhat resets the Caltech Winter 2007 results/persons. See below for details.</p>";
  
  echo "<hr>";
}

#----------------------------------------------------------------------
function resetDemo () {
#----------------------------------------------------------------------

  echo wcaDate() . "<br /><br />\n";

  #--- Delete all persons in Persons that were created at Caltech Winter 2007.
  echo "Deleting all persons in Persons that were created at Caltech Winter 2007.<br>";
  $personIdsNewAtCW7 = dbQuery("
    SELECT personId
    FROM Results
    WHERE competitionId='CaltechWinter2007' AND personId like '2007%'
  ");
  foreach( $personIdsNewAtCW7 as $person ){
    extract( $person );
    dbCommand( "DELETE FROM Persons WHERE id = '$personId'" );
  }
  
  #--- Delete all Caltech Winter 2007 results.
  echo "Deleting all Caltech Winter 2007 results.<br>";
  dbCommand( "DELETE FROM Results WHERE competitionId = 'CaltechWinter2007'" );
  
  #--- Insert all Caltech Winter 2007 results without personIds.
  echo "Inserting all Caltech Winter 2007 results without personIds.<br>";
  foreach( file( 'persons_reset_demo.txt' ) as $command ){

    #--- In the meantime we got a new format I need to adapt.
    $command = preg_replace( '/pos, personId/', 'personId, pos, personName', $command );
    $command = preg_replace( '/values \\(/', 'values (\'\', ', $command );

    #--- Execute the command.
    dbCommand( $command );
  }
  echo "<p>Reset finished.</p>";
}

?>
