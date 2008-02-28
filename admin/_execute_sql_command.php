<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );

showDescription();
executeSqlCommand();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script *DOES* affect the database.</b></p>";

  echo "<p>It's a helper script called by other scripts to execute one SQL command you chose on another page.</p>";
  
  echo "<hr>";
}

#----------------------------------------------------------------------
function executeSqlCommand () {
#----------------------------------------------------------------------

  $command = getRawParamThisShouldBeAnException( 'command' );
  echo "<p>Executing this command:</p>";
  echo "<p>" . htmlEscape( $command ) . "</p>";
  dbCommand( $command );
  echo "<p>Done.</p>";
}

?>
