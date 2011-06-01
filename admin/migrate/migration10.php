<?php

#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../../_header.php' );
require( '../_helpers.php' );

migrate();

require( '../../_footer.php' );

#----------------------------------------------------------------------
function migrate () {
#----------------------------------------------------------------------


  #--- Leave if we've done this migration already.
  if( ! databaseTableExists( 'ResultsStatus' )){
    noticeBox( false, "You need to apply migation 1 first." );
    return;
  }
  
  #--- Leave if we are already up-to-date
  $number = dbQuery( "
              SELECT value FROM  ResultsStatus
              WHERE  id = 'migration'
  ");
  $number = $number[0]['value'];
  if ($number != '9'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 9");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 10" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '10'
    WHERE  id = 'migration'
  ");


  #--- Apply the migration changes.
  alterTablePersons();

  #--- Yippie, we did it!
  noticeBox( true, "Migration completed." );
}

#----------------------------------------------------------------------
function reportAction ( $tableName, $message ) {
#----------------------------------------------------------------------

  echoAndFlush( "<p><b>$tableName: </b>$message...</p>" );
}

#----------------------------------------------------------------------
function alterTablePersons () {
#----------------------------------------------------------------------

  #--- Alter the field set.

  reportAction( "Persons", "Remove columns" );

  dbCommand("ALTER TABLE Persons
               DROP COLUMN `localName`,
               DROP COLUMN `romanName`");

}

?>
