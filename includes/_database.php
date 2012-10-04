<?

if( ! isset( $dontLoadCachedDatabase ))
  $dontLoadCachedDatabase = false;

establishDatabaseAccess();
if( ! $dontLoadCachedDatabase ){
  if( file_exists( pathToRoot() . 'generated/cachedDatabase.php' ))
    require( pathToRoot() . 'generated/cachedDatabase.php' );
  else
    noticeBox( false, 'I could not find the cachedDatabase.php file. Go <a href="admin/compute_auxiliary_data.php">here</a> to generate this file.' );
}

#----------------------------------------------------------------------
function establishDatabaseAccess () {
#----------------------------------------------------------------------

  #--- Load the local configuration data.
  require( '_config.php' );

  #--- Connect to the database server.
  mysql_connect( $configDatabaseHost, $configDatabaseUser, $configDatabasePass )
    or showDatabaseError( "Unable to connect to the database." );
    
  #--- Select the database.
  mysql_select_db( $configDatabaseName )
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
    stopTimer( 'printing the query' );
  }
  
  startTimer();
  $dbResult = mysql_query( $query )
    or showDatabaseError( "Unable to perform database query." );
  stopTimer( "pure query" );

  startTimer();
  $rows = array();
  while( $row = mysql_fetch_array( $dbResult ))
    $rows[] = $row;
  stopTimer( "fetching query results" );

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
    stopTimer( 'printing the query' );
  }
  
  startTimer();
  $dbResult = mysql_query( $query )
    or showDatabaseError( "Unable to perform database query." );
  global $dbQueryTotalTime;
  $dbQueryTotalTime += stopTimer( "pure query" );

  return $dbResult;
}

#----------------------------------------------------------------------
function dbCommand ( $command ) {
#----------------------------------------------------------------------

  if( wcaDebug() ){
    global $dbCommandCtr;
    $dbCommandCtr++;
    $commandForShow = strlen($command) < 1010
                    ? $command
                    : substr($command,0,1000) . '[...' . (strlen($command)-1000) . '...]';
    echo "\n\n<!-- dbCommand(\n$commandForShow\n) -->\n\n";
  }

  #--- Execute the command.
  $dbResult = mysql_query( $command )
    or showDatabaseError( "Unable to perform database command." );
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
       : "<p>Problem with the database, sorry. Should be fixed soon, please try again later.</p>" );
}

?>
