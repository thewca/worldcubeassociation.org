<?php

/**
 icklerf:
  I took liberty to replace each old mysql call with a direct replacement from the dbConn class
  This is not the ideal way, but php should be replaced very soon(TM)
**/


#----------------------------------------------------------------------
function mysqlEscape ( $string ) {
#----------------------------------------------------------------------
  global $wcadb_conn;
  return $wcadb_conn->mysqlEscape($string);
}

#----------------------------------------------------------------------
function dbQuery ( $query ) {
#----------------------------------------------------------------------
  global $wcadb_conn;
  return $wcadb_conn->dbQuery($query);
}

#----------------------------------------------------------------------
function dbQueryHandle ( $query ) {
#----------------------------------------------------------------------
  global $wcadb_conn;
  return $wcadb_conn->dbQuery($query);
}

#----------------------------------------------------------------------
function dbValue ( $query ) {
#----------------------------------------------------------------------
  $tmp = dbQuery( $query );
  return $tmp[0][0];
}

#----------------------------------------------------------------------
function dbCommand ( $command ) {
#----------------------------------------------------------------------
  global $wcadb_conn;
  return $wcadb_conn->dbCommand($command);
}

#----------------------------------------------------------------------
function getAllEvents () {
#----------------------------------------------------------------------
  return dbQuery("SELECT * FROM Events event WHERE event.rank<990 ORDER BY event.rank");
}

#----------------------------------------------------------------------
function getAllRounds () {
#----------------------------------------------------------------------
  return dbQuery("SELECT * FROM RoundTypes round_type ORDER BY round_type.rank");
}

#----------------------------------------------------------------------
function getAllCompetitions () {
#----------------------------------------------------------------------
  return dbQuery("
    SELECT id, cellName
    FROM Competitions
    ORDER BY (start_date BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY)) DESC, year DESC, month DESC, day DESC
  ");
}

#----------------------------------------------------------------------
function getAllUsedCountries () {
#----------------------------------------------------------------------
  return dbQuery("
    SELECT DISTINCT country.*
    FROM Results result, Countries country
    WHERE country.id = countryId
    ORDER BY country.name
  ");
}

#----------------------------------------------------------------------
function getAllUsedCountriesCompetitions () {
#----------------------------------------------------------------------
  return dbQuery("
    SELECT DISTINCT country.*
    FROM Competitions competition, Countries country
    WHERE country.id = countryId
    ORDER BY country.name
  ");
}

#----------------------------------------------------------------------
function getAllUsedContinents () {
#----------------------------------------------------------------------
  return dbQuery("
    SELECT DISTINCT Continents.*
    FROM Results
    JOIN Countries ON Countries.id = Results.countryId
    JOIN Continents ON Continents.id = Countries.continentId
  ");
}

#----------------------------------------------------------------------
function getAllUsedYears () {
#----------------------------------------------------------------------
  return dbQuery("SELECT DISTINCT year FROM Competitions WHERE showAtAll=1 ORDER BY year DESC");
}

#----------------------------------------------------------------------
function getAllIDs ( $rows ) {
#----------------------------------------------------------------------
  foreach ( $rows as $row )
    $ids[] = $row['id'];
  return $ids;
}

function getAllEventIds                    () { return getAllIDs( getAllEvents()                    ); }
function getAllRoundIds                    () { return getAllIDs( getAllRounds()                    ); }
function getAllCompetitionIds              () { return getAllIDs( getAllCompetitions()              ); }
function getAllUsedCountriesIds            () { return getAllIDs( getAllUsedCountries()             ); }
function getAllUsedCountriesCompetitionIds () { return getAllIDs( getAllUsedCountriesCompetitions() ); }
function getAllUsedContinentIds            () { return getAllIDs( getAllUsedContinents()            ); }

function getAllEventIdsIncludingObsolete () {
  return getAllIDs(dbQuery("SELECT event.id FROM Events event WHERE event.rank<1000 ORDER BY event.rank"));
}

#----------------------------------------------------------------------
function structureBy ( $results, $field ) {
#----------------------------------------------------------------------

  $allParts = array();
  foreach( $results as $result ){
    if( !isset($current) || $result[$field] != $current ){
      $current = $result[$field];
      if( isset( $thisPart ))
        $allParts[] = $thisPart;
      $thisPart = array();
    }
    $thisPart[] = $result;
  }
  if( isset( $thisPart ))
    $allParts[] = $thisPart;

  return $allParts;
}

#----------------------------------------------------------------------
function getCompetitionValue ( $competitionId, $valueSource ) {
#----------------------------------------------------------------------
  $tmp = dbQuery( "SELECT $valueSource value FROM Competitions WHERE id='$competitionId'" );
  $tmp = $tmp[0];
  return $tmp['value'];
}

#----------------------------------------------------------------------
function getFullCompetitionInfos ( $id ) {
#----------------------------------------------------------------------

  #--- Return hash with all competition data, or <false> if competition doesn't exist.
  $id = mysqlEscape( $id );
  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$id'" );
  if( count( $results ) != 1 )
    return false;
  return $results[0];
}

#----------------------------------------------------------------------
function getCompetitionOrganizers ( $id ) {
#----------------------------------------------------------------------

  #--- Return array of hashes with all organizers data.
  $id = mysqlEscape( $id );
  $results = dbQuery( "SELECT name, email, receive_registration_emails FROM competition_organizers LEFT JOIN users ON users.id=competition_organizers.organizer_id WHERE competition_organizers.competition_id='$id' ORDER BY name" );
  return $results;
}

#----------------------------------------------------------------------
function getCompetitionDelegates ( $id ) {
#----------------------------------------------------------------------

  #--- Return array of hashes with all delegates data.
  $id = mysqlEscape( $id );
  $results = dbQuery( "SELECT name, email, receive_registration_emails FROM competition_delegates LEFT JOIN users ON users.id=competition_delegates.delegate_id WHERE competition_delegates.competition_id='$id' ORDER BY name" );
  return $results;
}

#----------------------------------------------------------------------
function dbDebug ( $query ) {
#----------------------------------------------------------------------

  echo "<table border='1'>";
  foreach ( dbQuery( $query ) as $row ) {
    echo "<tr>";
    foreach ( array_values( $row ) as $value )
      echo "<td>" . htmlEntities( $value ) . "</td>";
    echo "</tr>";
  }
  echo "</table>";
}


#----------------------------------------------------------------------
function showDatabaseStatistics () {
#----------------------------------------------------------------------

  if( wcaDebug() ){
    global $dbQueryCtr, $dbQueryTotalTime, $dbCommandCtr, $dbCommandTotalTime;
    $queryStats = isset($dbQueryCtr) ? sprintf('<br />%d queries in %.4f seconds total', $dbQueryCtr, $dbQueryTotalTime) : '';
    $commandStats = isset($dbCommandCtr) ? sprintf('<br />%d commands in %.4f seconds total', $dbCommandCtr, $dbCommandTotalTime) : '';
    echo "<p style='color:#666'>$queryStats$commandStats</p>";
  }
}
