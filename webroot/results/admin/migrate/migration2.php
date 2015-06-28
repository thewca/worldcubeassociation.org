<?php

# - ResultsStatus['migration'] = '2'
#
# - New table "CompetitionsMedia" to store articles/reports/multimedia
#   for competitions. This replaces the fields in the Competitions table.
#
# - Table "Competitions":
#     - Remove fields {comments,articles,reports,multimedia}.


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

  #--- Leave if we are not at migration n-1
  if( ! databaseTableExists( 'ResultsStatus' )){
    noticeBox( false,  "You need to apply migration 1 first." );
    return;
  }

  #--- Leave if we are already up-to-date
  $number = dbQuery( "
              SELECT value FROM  ResultsStatus
              WHERE  id = 'migration'
  ");
  $number = $number[0]['value'];
  if ($number != '1'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 1");
    return;
  }
 

  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 2" );
  dbCommand( "
    UPDATE   ResultsStatus
      SET    value = '2'
      WHERE  id = 'migration'
  "); 

  #--- Apply the migration changes.
  buildTableCompetitionsMedia();
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
      submitterName      VARCHAR(50)      NOT NULL,
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

    $competition = getFullCompetitionInfos( $competitionId );
    $timestampComp = $competition['year'] . '-' . $competition['month'] . '-' . $competition['day'];
    //noticeBox( true, "One timestamp of comp $competitionId : $timestampComp" );

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
          (competitionId, type, uri, text, submitterComment, submitterEmail, submitterName, timestampSubmitted, timestampDecided, status)
        VALUES
          ('$competitionId', '$type', '$uri', '$text', '$comment', '', '', '$timestampComp', '$timestampComp', 'accepted')
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
      DROP   COLUMN `articles`,
      DROP   COLUMN `reports`,
      DROP   COLUMN `multimedia`
  ");
  

}

?>
