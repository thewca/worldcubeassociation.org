<?

establishDatabaseAccess();
if( ! $dontLoadCachedDatabase )
  require( 'cachedDatabase.php' );

#----------------------------------------------------------------------
function establishDatabaseAccess () {
#----------------------------------------------------------------------

  #--- Load the local configuration data.
  require( 'framework/_config.php' );

  #--- Connect to the database server.
  mysql_connect( $configDatabaseHost, $configDatabaseUser, $configDatabasePass )
    or die( "<p>Unable to connect to the database.<br />\n(" . mysql_error() . ")</p>\n" );
    
  #--- Select the database.
  mysql_select_db( $configDatabaseName )
    or die( "<p>Unable to access the database.<br />\n(" . mysql_error() . ")</p>\n" );
}

#----------------------------------------------------------------------
function mysqlEscape ( $string ) {
#----------------------------------------------------------------------
  return mysql_real_escape_string( $string );
}

#----------------------------------------------------------------------
function dbQuery ( $query ) {
#----------------------------------------------------------------------

  if( debug() ){
    startTimer();
    global $dbQueryCtr;
    $dbQueryCtr++;
    echo "\n\n<!-- dbQuery(\n$query\n) -->\n\n";
    echo "<br>";
    stopTimer( 'printing the query' );
  }
  
  startTimer();
  $dbResult = mysql_query( $query )
    or die("<p>Unable to perform database query.<br/>\n(" . mysql_error() . ")</p>\n");
  stopTimer( "pure query" );

  startTimer();
  $rows = array();
  while( $row = mysql_fetch_array( $dbResult ))
    $rows[] = $row;
  stopTimer( "fetching query results" );

  startTimer();
  mysql_free_result( $dbResult );
  stopTimer( "freeing the mysql result" );

  return $rows;
}

#----------------------------------------------------------------------
function dbCommand ( $command ) {
#----------------------------------------------------------------------

  if( debug() ){
    global $dbCommandCtr;
    $dbCommandCtr++;
    echo "\n\n<!-- dbCommand(\n$command\n) -->\n\n";
  }

  #--- Execute the command.
  $dbResult = mysql_query( $command )
    or die("<p>Unable to perform database command.<br/>\n(" . mysql_error() . ")</p>\n");
}

#----------------------------------------------------------------------
function getAllEvents () {
#----------------------------------------------------------------------
  global $cachedEvents;
  return $cachedEvents;
}

#----------------------------------------------------------------------
function getAllUnofficialEvents () {
#----------------------------------------------------------------------
  global $cachedUnofficialEvents;
  return $cachedUnofficialEvents;
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
function structureBy ( $results, $field ) {
#----------------------------------------------------------------------

  foreach( $results as $result ){
    if( $result[$field] != $current ){
      $current = $result[$field];
      if( $thisPart )
        $allParts[] = $thisPart;
      $thisPart = array();
    }
    $thisPart[] = $result;
  }
  if( $thisPart )
    $allParts[] = $thisPart;

  return $allParts;
}

#----------------------------------------------------------------------
function getCompetitionPassword ( $id ) {
#----------------------------------------------------------------------
  $tmp = dbQuery( "SELECT password FROM Competitions WHERE id='$id'" );
  $tmp = $tmp[0];
  return $tmp['password'];
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

?>
