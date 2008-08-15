<?php

#----------------------------------------------------------------------
function generateNewPassword ( $id ) {
#----------------------------------------------------------------------

  return sha1( $id . "foobidoo" . date( "F d Y, H:i:s" ));
}

#----------------------------------------------------------------------
function databaseTableExists ( $tableName ) {
#----------------------------------------------------------------------

  return count( dbQuery( "SHOW TABLES LIKE '$tableName'" )) == 1;
}

#----------------------------------------------------------------------
function cloneNewCompetition ( $newCompetitionId, $oldCompetitionId ) {
#----------------------------------------------------------------------

  #--- Get data from the old competition.
  $old = dbQuery(
    "SELECT
      name, cellName, countryId, cityName, information, website,
      organiser, venue, venueAddress, venueDetails, eventSpecs,
      wcaDelegate
    FROM Competitions
    WHERE id='$oldCompetitionId'"
  );
  $old = $old[0];

  #--- Generate a password for the new competition.
  $password = generateNewPassword( $newCompetitionId );

  #--- First provide id and password ...
  $keys = "id, password";
  $values = "'$newCompetitionId', '$password'";

  #--- ... then add the other data.
  foreach( $old as $key => $value ){
    if( ! preg_match( '/\d/', $key )){
      $value = mysqlEscape( $value );
      $keys .= ", $key";
      $values .= ", '$value'";
    }
  }

  #--- Insert the new competition into the database.
  dbCommand( "INSERT INTO Competitions ( $keys ) VALUES ( $values )" );
}

#----------------------------------------------------------------------
function createNewCompetition ( $id ) {
#----------------------------------------------------------------------

  $name = "NEW COMPETITION $id";
  $password = generateNewPassword( $id );
  dbCommand("
    INSERT INTO Competitions ( id, name, cellName, password )
    VALUES ( '$id', '$name', '$name', '$password' )
  ");
}   

#----------------------------------------------------------------------
function echoAndFlush ( $text ) {
#----------------------------------------------------------------------

  echo $text;
  ob_flush();
  flush();
}

#----------------------------------------------------------------------
function computeCachedDatabase ( $cacheFile ) {
#----------------------------------------------------------------------

  #--- Define the caches.
  $caches = array(

    'Events' =>
      'SELECT * FROM Events ORDER BY rank',

    'Competitions' =>
      'SELECT id, cellName FROM Competitions ORDER BY year DESC, month DESC, day DESC',
      
    'UsedContinents' =>
      'SELECT DISTINCT continent.*
       FROM Results result, Countries country, Continents continent
       WHERE country.id = countryId AND continent.id = continentId
       ORDER BY continent.name',

    'UsedCountries' =>
      'SELECT DISTINCT country.*
       FROM Results result, Countries country
       WHERE country.id = countryId
       ORDER BY country.name',

    'UsedYears' =>
      'SELECT DISTINCT year FROM Competitions ORDER BY year DESC'
  );

  #--- Compute and store the caches.
  $handle = fopen( $cacheFile, 'w' );
  fwrite( $handle, "<?\n\n" );
  foreach( $caches as $name => $query )
    fwrite( $handle, computeCacheEntry( $name, $query ));
  fwrite( $handle, "?>\n" );
  fclose( $handle );
}

#----------------------------------------------------------------------
function computeCacheEntry ( $name, $query ) {
#----------------------------------------------------------------------

  echo "<p>Building cached database entry <b>[</b>$name<b>]</b> ...<p>";

  #--- Process the rows.
  foreach( dbQuery( $query ) as $row ){
    $cells = array();

    #--- Process the cells.
    foreach( $row as $key => $value ){
      if( ! is_numeric( $key ))
        $cells[] = "\"$key\"=>\"$value\"";
    }
    $rows[] = "array(" . implode( ',', $cells ) . ")";
  }

  #--- Answer.
  return "\$cached$name =array(\n" . implode( ",\n", $rows ) . "\n);\n\n";
}

?>
