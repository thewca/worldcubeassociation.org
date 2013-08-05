<?php

# - New table "ResultsStatus" (id VARCHAR(50), value VARCHAR(50))
#   to store some attributes for the system.
# 
# - Start with: ResultsStatus['migration'] = '1'
#
# - Table "Competitions":
#     - Remove field "comments".
#     - Rename field "eventIds" to "eventSpecs".
#     - Repace endMonth/endDay zeroes with positive numbers.
  
 
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
  if( databaseTableExists( 'ResultsStatus' )){
    noticeBox( false, "This migration has already been applied." );
    return;
  }
  
  #--- ResultsStatus table: Create it.
  reportAction( "ResultsStatus", "Create" );
  dbCommand("
    CREATE TABLE ResultsStatus (
      id    VARCHAR(50) NOT NULL,
      value VARCHAR(50) NOT NULL
    )
  ");

  #--- ResultsStatus table: Set migration number.
  reportAction( "ResultsStatus", "Set migration number to 1" );
  dbCommand( "INSERT INTO ResultsStatus (id, value) VALUES ('migration', '1')" ); 

  #--- Apply the migration changes.
  alterTableCompetitions();
    
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
  reportAction( "Competitions", "Drop comments, rename eventIds to eventSpecs" );
  dbCommand("
    ALTER TABLE Competitions
      DROP   COLUMN `comments`,
      CHANGE COLUMN `eventIds` `eventSpecs` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL
  ");
  
  #--- Repace endMonth/endDay zeroes with positive numbers.
  reportAction( "Competitions", "Replace endMonth zeroes" );
  dbCommand( "UPDATE Competitions SET endMonth=month WHERE endMonth=0" );  
  
  #--- Repace endMonth/endDay zeroes with positive numbers.
  reportAction( "Competitions", "Replace endDay zeroes" );
  dbCommand( "UPDATE Competitions SET endDay=day WHERE endDay=0" );  
}

?>
