<?php

/**
 PLEASE NOTE: FUNCTIONALITY IN THIS FILE IS SET TO BE DEPRECATED.  Eventually PHP will no longer support the MySQL API, so this code
 needs to be phased out. Instead, please use or extend the mysqli connection class for any new code needing mysql functionality.
**/

if( ! isset( $dontLoadCachedDatabase ))
  $dontLoadCachedDatabase = false;

establishDatabaseAccess();
if( ! $dontLoadCachedDatabase ){
  if( file_exists( $config->get('filesPath') . 'generated/cachedDatabase.php' ))
    require( $config->get('filesPath') . 'generated/cachedDatabase.php' );
}

#----------------------------------------------------------------------
function establishDatabaseAccess () {
#----------------------------------------------------------------------
  global $config;
  $db_config = $config->get('database');

  #--- Connect to the database server.
  mysql_connect( $db_config['host'], $db_config['user'], $db_config['pass'] )
    or showDatabaseError( "Unable to connect to the database." );
    
  #--- Select the database.
  mysql_select_db( $db_config['name'] )
    or showDatabaseError( "Unable to access the database." );

  dbCommand( "SET NAMES 'utf8'" );
}

#----------------------------------------------------------------------
function mysqlEscape ( $string ) {
#----------------------------------------------------------------------
  return mysql_real_escape_string( $string );
}

#----------------------------------------------------------------------
function dbQuery ( $query ) {
#----------------------------------------------------------------------

  startTimer();

  if( wcaDebug() ){
    startTimer();
    global $dbQueryCtr;
    $dbQueryCtr++;
    echo "\n\n<!-- dbQuery(\n$query\n) -->\n\n";
    echo "<br>";
    stopTimer( 'printing the database query' );
  }
  
  startTimer();
  $dbResult = mysql_query( $query )
    or showDatabaseError( "Unable to perform database query." );
  stopTimer( "pure database query" );

  startTimer();
  $rows = array();
  while( $row = mysql_fetch_array( $dbResult ))
    $rows[] = $row;
  stopTimer( "fetching database query results" );

  startTimer();
  mysql_free_result( $dbResult );
  stopTimer( "freeing the mysql result" );

  global $dbQueryTotalTime;
  $dbQueryTotalTime += stopTimer( "the whole dbQuery execution" );

  return $rows;
}

#----------------------------------------------------------------------
function dbQueryHandle ( $query ) {
#----------------------------------------------------------------------

  if( wcaDebug() ){
    startTimer();
    global $dbQueryCtr;
    $dbQueryCtr++;
    echo "\n\n<!-- dbQuery(\n$query\n) -->\n\n";
    echo "<br>";
    stopTimer( 'printing the database query' );
  }
  
  startTimer();
  $dbResult = mysql_query( $query )
    or showDatabaseError( "Unable to perform database query." );
  global $dbQueryTotalTime;
  $dbQueryTotalTime += stopTimer( "pure database query" );

  return $dbResult;
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

  if( wcaDebug() ){
    startTimer();
    global $dbCommandCtr;
    $dbCommandCtr++;
    $commandForShow = strlen($command) < 1010
                    ? $command
                    : substr($command,0,1000) . '[...' . (strlen($command)-1000) . '...]';
    echo "\n\n<!-- dbCommand(\n$commandForShow\n) -->\n\n";
    stopTimer( 'printing the database command' );
  }

  #--- Execute the command.
  startTimer();
  $dbResult = mysql_query( $command )
    or showDatabaseError( "Unable to perform database command." );
  global $dbCommandTotalTime;
  $dbCommandTotalTime += stopTimer( "executing database command" );
}

#----------------------------------------------------------------------
function getAllEvents () {
#----------------------------------------------------------------------
  global $cachedEvents;
  return $cachedEvents;
}

#----------------------------------------------------------------------
function getAllRounds () {
#----------------------------------------------------------------------
  global $cachedRounds;
  return $cachedRounds;
}

#----------------------------------------------------------------------
function getAllCompetitions () {
#----------------------------------------------------------------------
  global $cachedCompetitions;
  return $cachedCompetitions;
}

#----------------------------------------------------------------------
function getAllUsedCountries () {
#----------------------------------------------------------------------
  global $cachedUsedCountries;
  return $cachedUsedCountries;
}

#----------------------------------------------------------------------
function getAllUsedCountriesCompetitions () {
#----------------------------------------------------------------------
  global $cachedUsedCountriesCompetitions;
  return $cachedUsedCountriesCompetitions;
}

#----------------------------------------------------------------------
function getAllUsedContinents () {
#----------------------------------------------------------------------
  global $cachedUsedContinents;
  return $cachedUsedContinents;
}

#----------------------------------------------------------------------
function getAllUsedYears () {
#----------------------------------------------------------------------
  global $cachedUsedYears;
  return $cachedUsedYears;
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
  return getAllIDs(dbQuery("SELECT id FROM Events WHERE rank<1000 ORDER BY rank"));
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
function getCompetitionPassword ( $id, $admin ) {
#----------------------------------------------------------------------
  if( $admin )
    $tmp = dbQuery( "SELECT adminPassword password FROM Competitions WHERE id='$id'" );
  else
    $tmp = dbQuery( "SELECT organiserPassword password FROM Competitions WHERE id='$id'" );
  $tmp = $tmp[0];
  return $tmp['password'];
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
function showDatabaseError ( $message ) {
#----------------------------------------------------------------------

  #--- Normal users just get a "Sorry", developers/debuggers get more details
  die( $_SERVER['SERVER_NAME'] == 'localhost'  ||  wcaDebug()
       ? "<p>$message<br />\n(" . mysql_error() . ")</p>\n"
       : "<p>Problem with the database, sorry. If this persists for several minutes, " .
         "please tell us at <a href='mailto:wca-website@googlegroups.com'>wca-website@googlegroups.com</a></p>" );
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
