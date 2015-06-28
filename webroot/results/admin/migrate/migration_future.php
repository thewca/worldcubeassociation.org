<?php

# - New table "ResultsStatus" (id VARCHAR(50), value VARCHAR(50))
#   to store some attributes for the system.
# 
# - Start with: ResultsStatus['migration'] = '1'
#
# - New table "CompetitionsMedia" to store articles/reports/multimedia
#   for competitions. This replaces the fields in the Competitions table.
#
# - Table "Competitions":
#     - Remove fields {comments,articles,reports,multimedia}.
#     - "eventIds" becomes "eventSpecs" and includes time/person limits.
#     - Add field "preregPreface".
#     - Add flags {showAtAll,showResults,showPreregForm,showPreregList}.
#     - Add {viewPassword,editPassword}.
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

# TODO: unescape the uris.
    
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
  buildTableCompetitionsMedia();
  alterTableCompetitions();
    
  #--- PreRegs table: Create it.
  
  #--- UPDATE aux...

  #--- Yippie, we did it!
  noticeBox( true, "Migration completed." );
}

#----------------------------------------------------------------------
function reportAction ( $tableName, $message ) {
#----------------------------------------------------------------------

  echoAndFlush( "<p><b>$tableName: </b>$message...</p>" );
}

#----------------------------------------------------------------------
function buildTableCompetitionsMedia () {
#----------------------------------------------------------------------

  #--- CompetitionsMedia table: Create it.
  reportAction( "CompetitionsMedia", "Create" );
  dbCommand("
    CREATE TABLE CompetitionsMedia (
      id                 INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
      competitionId      VARCHAR(32)      NOT NULL,
      type               VARCHAR(15)      NOT NULL,
      text               VARCHAR(100)     NOT NULL,
      uri                VARCHAR(500)     NOT NULL,
      submitterComment   VARCHAR(500)     NOT NULL,
      submitterEmail     VARCHAR(45)      NOT NULL,
      timestampSubmitted TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      timestampDecided   TIMESTAMP        NOT NULL,
      status             VARCHAR(10)      NOT NULL,
      PRIMARY KEY ( id )
    )
 ");

  #--- Get the data from the Competitions table.
  $media = dbQuery("
    SELECT id competitionId, 'report' type, reports data FROM Competitions
    UNION
    SELECT id competitionId, 'article' type, articles data FROM Competitions
    UNION
    SELECT id competitionId, 'multimedia' type, multimedia data FROM Competitions
  ");
  
  #--- Fill the CompetitionsMedia table with the data.
  reportAction( "CompetitionsMedia", "Fill with data from table Competitions" );  
#  echo "<table>";
  foreach( $media as $data ){
    extract( $data ); # competitionId, type, data
#    if( $competitionId == 'BelgianOpen2007' )
#      echo "<b>$data</b>";
      
    preg_match_all( '/\[ \{ ([^}]+) } \{ ([^}]+) } ]/x', $data, $matches, PREG_SET_ORDER );
    foreach( $matches as $match ){
      list( $all, $text, $uri ) = $match;
      
      #--- Polish the data.
      $text = mysqlEscape( $text );
      $uri = mysqlEscape( $uri );
      
#      echo "<tr><td>";
#      echo implode( "</td><td>", array( $competitionId, $type, $text, $uri ));
#      echo "</td></tr>";
      dbCommand("
        INSERT INTO CompetitionsMedia
          (competitionId, type, uri, text, submitterComment, submitterEmail, timestampDecided, status)
        VALUES
          ('$competitionId', '$type', '$uri', '$text', '$comment', '', now(), 'accepted')
      "); 
    }
  }
#  echo "</table>";
}

#----------------------------------------------------------------------
function alterTableCompetitions () {
#----------------------------------------------------------------------

  #--- Alter the field set.
  reportAction( "Competitions", "Alter field set" );
  dbCommand("
    ALTER TABLE Competitions
      DROP   COLUMN `comments`,
      DROP   COLUMN `articles`,
      DROP   COLUMN `reports`,
      DROP   COLUMN `multimedia`,
      CHANGE COLUMN `eventIds` `eventSpecs` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
      ADD    COLUMN `preregPreface`  TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
      ADD    COLUMN `showAtAll`      BOOLEAN NOT NULL DEFAULT 0,
      ADD    COLUMN `showResults`    BOOLEAN NOT NULL DEFAULT 0,
      ADD    COLUMN `showPreregForm` BOOLEAN NOT NULL DEFAULT 0,
      ADD    COLUMN `showPreregList` BOOLEAN NOT NULL DEFAULT 0,
      ADD    COLUMN `viewPassword`   VARCHAR(45) NOT NULL,
      ADD    COLUMN `editPassword`   VARCHAR(45) NOT NULL;
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
      SET viewPassword='$password', editPassword='$password'
      WHERE id='$id'
    " );  
  }

  #--- Repace endMonth/endDay zeroes with positive numbers.
  reportAction( "Competitions", "Replace endMonth/endDay zeroes" );
  dbCommand( "UPDATE Competitions SET endMonth=month WHERE endMonth=0" );
  dbCommand( "UPDATE Competitions SET endDay=day WHERE endDay=0" );  
}

?>
