<?php

# - Set ResultsStatus['migration'] to '3'
#
# - Table "Competitions":
#     - Add flags {showAtAll,showResults}.
#     - Add {password}.
#     - Set showAtAll to 1
#     - Set showResults to 1 for all competitions with results.
#     - Generate random passwords.

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
  if ($number != '2'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 2");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 3" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '3'
    WHERE  id = 'migration'
  ");


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
  reportAction( "Competitions", "Alter field set" );
  dbCommand("
    ALTER TABLE Competitions
      ADD    COLUMN `showAtAll`      BOOLEAN NOT NULL DEFAULT 0,
      ADD    COLUMN `showResults`    BOOLEAN NOT NULL DEFAULT 0,
      ADD    COLUMN `password`       VARCHAR(45) NOT NULL;
  ");
  
  #--- Make showAtAll true, and showResults true for all competitions with results. 
  reportAction( "Competitions", "Set {showAtAll,showResults}" );
  dbCommand( "UPDATE Competitions SET showAtAll=1" );
  dbCommand( "
    UPDATE Competitions competition, Results result
    SET    competition.showResults = 1
    WHERE  competition.id = result.competitionId;
  " );

  #--- Generate passwords for all competitions.
  reportAction( "Competitions", "Generate passwords" );
  $competitions = dbQuery( "SELECT id FROM Competitions" );
  foreach( $competitions as $competition  ){
    extract( $competition );
    $password = generateNewPassword( $id );
    dbCommand( "
      UPDATE Competitions
      SET password='$password'
      WHERE id='$id'
    " );  
  }
}

?>
