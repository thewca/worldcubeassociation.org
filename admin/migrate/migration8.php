<?php

#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../../includes/_header.php' );
require( '../_helpers.php' );

migrate();

require( '../../includes/_footer.php' );

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
  if ($number != '7'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 7");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 8" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '8'
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

  reportAction( "Persons", "Alter field set" );

  dbCommand("
    ALTER TABLE Persons
      ADD    COLUMN `romanName`  VARCHAR(80) CHARACTER SET utf8 NOT NULL DEFAULT ''
  ");

  dbCommand("
    ALTER TABLE Persons
      CHANGE `name` `name` VARCHAR(80) CHARACTER SET utf8
  ");

  dbCommand("
    ALTER TABLE Results
      CHANGE `personName` `personName` VARCHAR(80) CHARACTER SET utf8
  ");

  dbCommand("
    ALTER TABLE Preregs
      CHANGE `name` `name` VARCHAR(80) CHARACTER SET utf8
  ");

  dbCommand("
    UPDATE Persons
      SET romanName=name
  ");
}

?>
