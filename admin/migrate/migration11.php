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
  if ($number != '10'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 10");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 11" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '11'
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

  reportAction( "Competitions", "Change columns" );

  dbCommand("ALTER TABLE Competitions
               ALTER COLUMN `showAtAll` SET DEFAULT '0'");
  dbCommand("ALTER TABLE Competitions
               ADD COLUMN `adminPassword` VARCHAR(45) NOT NULL DEFAULT ''");
  dbCommand("ALTER TABLE Competitions
               ADD COLUMN `isConfirmed` TINYINT(1) NOT NULL DEFAULT '0'");
  dbCommand("ALTER TABLE Competitions
               CHANGE password organiserPassword VARCHAR(45)");
  dbCommand("ALTER TABLE Competitions
               DROP COLUMN `showResults`");

ALTER [COLUMN] col_name {SET DEFAULT literal

  #--- Generate admin passwords for all competitions.
  reportAction( "Competitions", "Generate admin passwords" );
  $competitions = dbQuery( "SELECT id FROM Competitions" );
  foreach( $competitions as $competition  ){
    extract( $competition );
    $password = generateNewPassword( $id );
    dbCommand( "
      UPDATE Competitions
      SET adminPassword='$password'
      WHERE id='$id'
    " );
  }

  #--- Set all competitions to confirmed status.
  reportAction( "Competitions", "Change to confirmed" );
  dbCommand( "
    UPDATE Competitions
    SET isConfirmed='1'
  " );

}

?>
