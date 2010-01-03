<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$dontLoadCachedDatabase = true;

require( '../_header.php' );
require( '_helpers.php' );
showDescription();
computeConciseRecords();
computeRanks();
computeCachedDatabase('../cachedDatabase.php');
require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script *does* affect the database.<br><br>It computes the auxiliary tables ConciseSingleResults, ConciseAverageResults, RanksSingle and RanksAverage, as well as the cachedDatabase.php script. It must be run after changes to the database data so that these tables are up-to-date. It displays the time so you can be sure it just got executed and didn't come from some cache.</b></p><hr>";
}

#----------------------------------------------------------------------
function computeConciseRecords () {
#----------------------------------------------------------------------

  echo wcaDate() . "<br /><br />\n";

  foreach( array( array( 'best', 'Single' ), array( 'average', 'Average' )) as $foo ){
    $valueSource = $foo[0];
    $valueName = $foo[1];

    startTimer();
    echo "Building table Concise${valueName}Records...<br />\n";
    
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
      ORDER BY
        $valueSource DESC, personName
    ");
    
    stopTimer( "Concise${valueName}Results" );
    echo "... done<br /><br />\n";
  }
}

#----------------------------------------------------------------------
function computeRanks () {
#----------------------------------------------------------------------

  foreach( array( array( 'best', 'Single' ), array( 'average', 'Average' )) as $foo ){
    $valueSource = $foo[0];
    $valueName = $foo[1];

    startTimer();
    echo "<br />Building table Ranks$valueName...<br />\n";

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
      ORDER BY subId
    " );
    foreach( $persons as $person ) {
      extract( $person );
      $currentCountry  [$personId] = $countryId;
      $currentContinent[$personId] = $continentId;
    }

    $world = dbQuery("
      SELECT
        min($valueSource) min,
        personId,
        eventId
      FROM 
        Concise${valueName}Results
      WHERE
        eventId <> '333mbo'
      GROUP BY
        eventId,
        personId
      ORDER BY
        eventId, min
    ");

    $rank = 0;
    $event = $world[0]['eventId'];
    $value = -42;
    $count = 1;


    foreach( $world as $w ){
      extract( $w );
      if( $event != $eventId ){
        $rank = 0;
        $count = 1;
        $value = -42;
      }
      if( $value == $min )
        $count++;
      else { 
        $rank += $count;
        $count = 1;
      }
      if( ! $ranks[$personId][$eventId] )
        $ranks[$personId][$eventId] = $rank;
      if( ! $ranksBest[$personId][$eventId] )
        $ranksBest[$personId][$eventId] = $min;
      $event = $eventId;
      $value = $min;
    }

    unset( $world );

    $continent = dbQuery("
      SELECT
        min($valueSource) min,
        personId,
        eventId,
        continentId
      FROM 
        Concise${valueName}Results
      WHERE
        eventId <> '333mbo'
      GROUP BY
        eventId,
        personId,
        continentId
      ORDER BY
        eventId, continentId, min
    ");

    $rank = 0;
    $event = $continent[0]['eventId'];
    $ct = $continent[0]['continentId'];
    $value = -42;
    $count = 1;

    foreach( $continent as $c ){
      extract( $c );
      if(( $event != $eventId ) || ( $ct != $continentId )){
        $rank = 0;
        $count = 1;
        $value = -42;
      }
      if( $value == $min )
        $count++;
      else { 
        $rank += $count;
        $count = 1;
      }
      if( $continentId==$currentContinent[$personId] )
          $ranksContinent[$personId][$eventId] = $rank;
      $event = $eventId;
      $value = $min;
      $ct = $continentId;
    }

    unset( $continent );

    $country = dbQuery("
      SELECT
        min($valueSource) min,
        personId,
        eventId,
        countryId
      FROM 
        Concise${valueName}Results
      WHERE
        eventId <> '333mbo'
      GROUP BY
        eventId,
        personId,
        countryId
      ORDER BY
        eventId, countryId, min
    ");

    $rank = 0;
    $event = $country[0]['eventId'];
    $cy = $country[0]['countryId'];
    $value = -42;
    $count = 1;

    foreach( $country as $c ){
      extract( $c );
      if(( $event != $eventId ) || ( $cy != $countryId )){ 
        $rank = 0;
        $count = 1;
        $value = -42;
      }
      if( $value == $min )
        $count++;
      else { 
        $rank += $count;
        $count = 1;
      }
      if( $countryId==$currentCountry[$personId] )
        $ranksCountry[$personId][$eventId] = $rank;
      $event = $eventId;
      $cy = $countryId;
      $value = $min;
    }

    unset( $country );

    $command = "";
    foreach( $ranks as $personId => $rankse ){
      foreach( $rankse as $eventId => $rankspe ){
        $command .= $command ? "," : "INSERT INTO Ranks$valueName (personId, eventId, best, worldRank, continentRank, countryRank) VALUES ";
        $command .= "('$personId', '$eventId', '" . $ranksBest[$personId][$eventId] . "','";
        $command .= $rankspe . "','";
        $command .= $ranksContinent[$personId][$eventId]+0 . "','";
        $command .= $ranksCountry[$personId][$eventId]+0 . "')";
        if( strlen( $command ) > 500000 ){
          dbCommand( $command );
          $command = "";
        }
      }
    }

    unset( $ranks );
    unset( $ranksContinent );
    unset( $ranksCountry );
    unset( $ranksBest );

    if( $command )
      dbCommand( $command );

    stopTimer( "Ranks$valueName" );
    echo "... done<br /><br />\n";
  }
}


?>
