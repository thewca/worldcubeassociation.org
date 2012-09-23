<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$dontLoadCachedDatabase = true;

error_reporting(E_ERROR);
ini_set('display_errors', 1);

require( '../_header.php' );
require( '_helpers.php' );
analyzeChoices();
adminHeadline( 'Compute auxiliary data' );
showDescription();
showChoices();

if( $chosenDoIt ){
  noticeBox3( 0, "Note: At the end of this, when this page is completed, you should see a green success box at the bottom of the page. If not, something went wrong (like an out-of-memory error we recently had, which killed the script)." );
  computeConciseRecords();
  computeRanks( 'best', 'Single' );
  computeRanks( 'average', 'Average' );
  computeCachedDatabase('../generated/cachedDatabase.php');
  deleteCaches();
  noticeBox3( 1, "Ok, finished.<br />" . wcaDate() );
}

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>This computes the auxiliary tables ConciseSingleResults, ConciseAverageResults, RanksSingle and RanksAverage, as well as the cachedDatabase.php script, and clears the caches.</p>\n";

  echo "<p>Do it after changes to the database data so that these things are up-to-date.</p><hr />\n";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenDoIt;

  $chosenDoIt = getNormalParam( 'doit' );
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    choiceButton( true, 'doit', ' Do it now ' )
  ));
}

#----------------------------------------------------------------------
function computeConciseRecords () {
#----------------------------------------------------------------------

  foreach( array( array( 'best', 'Single' ), array( 'average', 'Average' )) as $foo ){
    $valueSource = $foo[0];
    $valueName = $foo[1];

    startTimer();
    echo "Building table Concise${valueName}Results...<br />\n";
    
    dbCommand( "DROP TABLE IF EXISTS Concise${valueName}Results" );
    dbCommand("
      CREATE TABLE
        Concise${valueName}Results
      SELECT
        result.id,
        $valueSource,
        valueAndId,
        personId,
        eventId,
        country.id countryId,
        continentId,
        year, month, day
      FROM
        ( SELECT   MIN($valueSource * 1000000000 + result.id) valueAndId
          FROM     Results result, Competitions competition
          WHERE    $valueSource>0 AND competition.id = competitionId
          GROUP BY personId, eventId, year ) helper,
        Results      result,
        Competitions competition,
        Countries    country
      WHERE 1
        AND result.id      = valueAndId % 1000000000
        AND competition.id = competitionId
        AND country.id     = result.countryId
    ");
    
    stopTimer( "Concise${valueName}Results" );
    echo "... done<br /><br />\n";
  }
}

#----------------------------------------------------------------------
function computeRanks ( $valueSource, $valueName ) {
#----------------------------------------------------------------------

  startTimer();
  echo "<br />Building table Ranks$valueName...<br />\n";

  #--- Create empty table
  dbCommand( "DROP TABLE IF EXISTS Ranks$valueName" );
  dbCommand( "CREATE TABLE Ranks$valueName (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `personId` VARCHAR(10) NOT NULL DEFAULT '',
    `eventId` VARCHAR(6) NOT NULL DEFAULT '',
    `best` INTEGER NOT NULL DEFAULT '0',
    `worldRank` INTEGER NOT NULL DEFAULT '0',
    `continentRank` INTEGER NOT NULL DEFAULT '0',
    `countryRank` INTEGER NOT NULL DEFAULT '0',
  PRIMARY KEY  (`id`),
  KEY `fk_persons` (`personId`),
  KEY `fk_events` (`eventId`)) COLLATE latin1_swedish_ci
  " );

  #--- Determine everybody's current country and continent
  $persons = dbQuery( "
    SELECT   person.id personId, countryId, continentId
    FROM     Persons person, Countries country
    WHERE    country.id=countryId
      AND    person.subId=1
  " );
  foreach( $persons as $person ) {
    extract( $person );
    $currentCountry  [$personId] = $countryId;
    $currentContinent[$personId] = $continentId;
  }
  unset( $persons );

  #--- Get all personal records (where person=personId+countryId)
  $personalRecords = dbQueryHandle( "
    SELECT   personId, countryId, continentId, eventId, min($valueSource) value
    FROM     Concise${valueName}Results
    WHERE    eventId <> '333mbo'
    GROUP BY personId, countryId, eventId
    ORDER BY eventId, value
  " );

  #--- Process the personal records
  while( $row = mysql_fetch_row( $personalRecords )){
    list( $personId, $countryId, $continentId, $eventId, $value ) = $row;
    
    #--- At new event, store the ranks of the previous and reset
    if ( $eventId != $currentEventId ) {
      storeRanks( $valueName, $currentEventId, $personRecord, $personWR, $personCR, $personNR );
      unset( $ctr, $rank, $record, $ranked, $personRecord, $personWR, $personCR, $personNR );
      $currentEventId = $eventId;
    }

    #--- Update the region states (unless we have ranked this person there already)
    foreach( array( 'World', $continentId, $countryId ) as $region ){
      if ( ! $ranked[$region][$personId] ) {
        ++$ctr[$region];
        if ( $value != $record[$region] )
          $rank[$region] = $ctr[$region];
        $record[$region] = $value;
        $ranked[$region][$personId] = true;
      }
    }

    #--- Set the person's data (first time the current location is matched)
    if ( ! $personRecord[$personId] ) {
      $personRecord[$personId] = $value;
      $personWR[$personId] = $rank['World'];
    }
    if ( $continentId==$currentContinent[$personId] && ! $personCR[$personId] )
      $personCR[$personId] = $rank[$continentId];
    if ( $countryId==$currentCountry[$personId] && ! $personNR[$personId] )
      $personNR[$personId] = $rank[$countryId];
  }

  #--- Free the result handle
  mysql_free_result( $personalRecords );

  #--- Store the ranks of the last event  
  storeRanks( $valueName, $currentEventId, $personRecord, $personWR, $personCR, $personNR );

  stopTimer( "Ranks$valueName" );
  echo "... done<br /><br />\n";
}

function storeRanks ( $valueName, $eventId, &$personRecord, &$personWR, &$personCR, &$personNR ) {
  if ( ! count( $personRecord ) )
    return;
  $values = array();
  foreach ( $personRecord as $personId => $record ) {
    $v = array( $personId, $eventId, $record, $personWR[$personId], $personCR[$personId]+0, $personNR[$personId]+0 );
    array_push( $values, "('" . implode( "', '", $v ) . "')" );
  }
  $values = implode( ",\n", $values );
  dbCommand( "INSERT INTO Ranks$valueName (personId, eventId, best, worldRank, continentRank, countryRank) VALUES\n$values" );
}

?>
