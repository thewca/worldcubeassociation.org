<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$dontLoadCachedDatabase = true;

error_reporting(E_ALL);
ini_set('display_errors', 1);

$currentSection = 'admin';
require( '../includes/_header.php' );
require( '_helpers.php' );
analyzeChoices();
adminHeadline( 'Compute auxiliary data' );
showDescription();
showChoices();

if( $chosenDoIt ){
  noticeBox3( 0, "Note: At the end of this, when this page is completed, you should see a green success box at the bottom of the page. If not, something went wrong (like an out-of-memory error we recently had, which killed the script)." );

  // Adding best-3 mean computations, for 2014 mean/3 recognition.
  computeBest3();

  computeConciseRecords();
  computeRanks( 'best', 'Single' );
  computeRanks( 'average', 'Average' );
  computeCachedDatabase('../generated/cachedDatabase.php');
  deleteCaches();
  noticeBox3( 1, "Ok, finished.<br />" . wcaDate() );
}

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>This computes means for 3x3 bld, the auxiliary tables ConciseSingleResults, ConciseAverageResults, RanksSingle and RanksAverage, as well as the cachedDatabase.php script, and clears the caches.</p>\n";

  echo "<p>Do it after changes to the database data so that these things are up-to-date.</p><hr />\n";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenDoIt;

  // When running as a CGI script, getNormalParam doesn't seem to work.
  // This is a quick and dirty workaround that looks directly at the
  // relevant CGI environment variable.
  //$chosenDoIt = getNormalParam( 'doit' );
  $requestUri = $_SERVER['REQUEST_URI'];
  $chosenDoIt = strrpos($requestUri, "doit=") !== FALSE;
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    choiceButton( true, 'doit', ' Do it now ' )
  ));
}

#----------------------------------------------------------------------
function computeBest3 () {
#----------------------------------------------------------------------

  echo "Computing means for best-of-3 results in 333bf...<br />\n";
  startTimer();

  // Set new DNF averages
  dbCommand("
    UPDATE Results
    SET average = -1
      WHERE eventId = '333bf'
        AND average = 0
        AND formatId ='3'
        AND value1 != 0
        AND value2 != 0
        AND value3 != 0
        AND (value1<0 OR value2<0 OR value3<0)
    ");

  // Set new averages (round times > 10:00)
  dbCommand("
    UPDATE Results
    SET average = IF( (value1+value2+value3)/3.0 > 60000, (value1+value2+value3)/3.0 - MOD((value1+value2+value3)/3.0,100), (value1+value2+value3)/3.0)
      WHERE eventId = '333bf'
        AND average = 0
        AND formatId ='3'
        AND value1 > 0
        AND value2 > 0
        AND value3 > 0
    ");

  stopTimer( "Best3Means" );
  echo "... done<br /><br />\n";
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
          FROM     Results result, Competitions competition, Events event
          WHERE    $valueSource>0 AND competition.id = competitionId AND event.id = eventId AND event.rank < 990
          GROUP BY personId, result.countryId, eventId, year ) helper,
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
  KEY `fk_events` (`eventId`)) COLLATE utf8_unicode_ci
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

  #--- Get all personal records (note: country-switchers appear once for each country)
  $personalRecords = dbQueryHandle( "
    SELECT   personId, countryId, continentId, eventId, min($valueSource) value
    FROM     Concise${valueName}Results
    WHERE    eventId <> '333mbo'
    GROUP BY personId, countryId, eventId
    ORDER BY eventId, value
  " );

  #--- Process the personal records
  $missingPersonIDs = false;
  while( $row = mysql_fetch_row( $personalRecords )){
    list( $personId, $countryId, $continentId, $eventId, $value ) = $row;
    if( ! $personId ){
      $missingPersonIDs = true;
      continue;
    }

    #--- At new event, store the ranks of the previous and reset
    if ( isset($latestEventId)  &&  $eventId != $latestEventId ) {
      storeRanks( $valueName, $latestEventId, $personRecord, $personWR, $personCR, $personNR );
      unset( $ctr, $rank, $record, $ranked, $personRecord, $personWR, $personCR, $personNR );
    }

    #--- Update the region states (unless we have ranked this person there already, for
    #--- example 2008SEAR01 twice in North America and World because of his two countries)
    foreach( array( 'World', $continentId, $countryId ) as $region ){
      if ( ! isset($ranked[$region][$personId]) ) {
        $ctr[$region] = isset($ctr[$region]) ? $ctr[$region] + 1 : 1;    # ctr always increases
        if ( !isset($record[$region])  ||  $value > $record[$region] )   # rank only if value worse than previous
          $rank[$region] = $ctr[$region];
        $record[$region] = $value;
        $ranked[$region][$personId] = true;
      }
    }

    #--- Set the person's data (first time the current location is matched)
    if ( ! isset($personRecord[$personId]) ) {
      $personRecord[$personId] = $value;
      $personWR[$personId] = $rank['World'];
    }
    if ( $continentId==$currentContinent[$personId] && ! isset($personCR[$personId]) )
      $personCR[$personId] = $rank[$continentId];
    if ( $countryId==$currentCountry[$personId] && ! isset($personNR[$personId]) )
      $personNR[$personId] = $rank[$countryId];

    $latestEventId = $eventId;
  }

  #--- Free the result handle
  mysql_free_result( $personalRecords );

  #--- Store the ranks of the last event  
  storeRanks( $valueName, $latestEventId, $personRecord, $personWR, $personCR, $personNR );

  if( $missingPersonIDs )
    noticeBox3( 0, 'Warning: some results are ignored because they are missing a personId' );
  stopTimer( "Ranks$valueName" );
  echo "... done<br /><br />\n";
}

function storeRanks ( $valueName, $eventId, &$personRecord, &$personWR, &$personCR, &$personNR ) {
  if ( ! count( $personRecord ) )
    return;
  $values = array();
  foreach ( $personRecord as $personId => $record ) {
    $cr = isset($personCR[$personId]) ? $personCR[$personId] : 0;   # It's possible have a world/continental rank (from
    $nr = isset($personNR[$personId]) ? $personNR[$personId] : 0;   # previous country) but no continental/national rank
    $v = array( $personId, $eventId, $record, $personWR[$personId], $cr, $nr );
    array_push( $values, "('" . implode( "', '", $v ) . "')" );
  }
  $values = implode( ",\n", $values );
  dbCommand( "INSERT INTO Ranks$valueName (personId, eventId, best, worldRank, continentRank, countryRank) VALUES\n$values" );
}
