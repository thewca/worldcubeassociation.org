<?php

# - Set ResultsStatus['migration'] to '4'
#
# - Table "Competitions":
#     - Add flags {showPreregForm,showPreregList} set to 0.



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
  if ($number != '3'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 3");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 4" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '4'
    WHERE  id = 'migration'
  ");


  #--- Apply the migration changes.
  alterTableCompetitions();
  createTablePreregs();
    
  #--- Yippie, we did it!
  noticeBox( true, "Migration completed." );
}

#----------------------------------------------------------------------
function reportAction ( $tableName, $message ) {
#----------------------------------------------------------------------

  echoAndFlush( "<p><b>$tableName: </b>$message...</p>" );
}

#----------------------------------------------------------------------
function alterTableCompetitions () {
#----------------------------------------------------------------------

  #--- Alter the field set.
  reportAction( "Competitions", "Alter field set" );
  dbCommand("
    ALTER TABLE Competitions
      ADD    COLUMN `showPreregForm` BOOLEAN NOT NULL DEFAULT 0,
      ADD    COLUMN `showPreregList` BOOLEAN NOT NULL DEFAULT 0
  ");
  
  }
#----------------------------------------------------------------------
function createTablePreregs () {
#----------------------------------------------------------------------

  #--- Create the table.
  reportAction( "Preregs", "Create" );

  foreach( getAllEvents() as $event ){
    extract( $event );
    $eventFields .= "E$id BOOLEAN NOT NULL DEFAULT 0,";
  }

  dbCommand("
    CREATE TABLE Preregs (
      id                 INTEGER UNSIGNED     NOT NULL AUTO_INCREMENT,
      competitionId      VARCHAR(32)          NOT NULL,
      name               VARCHAR(80)          NOT NULL,
      personId           VARCHAR(10)          NOT NULL,
      countryId          VARCHAR(50)          NOT NULL,
      gender             CHAR(1)              NOT NULL,
      birthYear          SMALLINT(6) UNSIGNED NOT NULL,
      birthMonth         TINYINT(4)  UNSIGNED NOT NULL,
      birthDay           TINYINT(4)  UNSIGNED NOT NULL,
      email              VARCHAR(80)          NOT NULL,
      guests             TEXT                 NOT NULL,
      comments           TEXT                 NOT NULL,
      ip                 VARCHAR(16)          NOT NULL,
      status             CHAR(1)              NOT NULL,
      $eventFields
      PRIMARY KEY ( id )
    )");

}

?>
