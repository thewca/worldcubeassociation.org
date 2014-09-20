<?php

#----------------------------------------------------------------------
function generateNewPassword ( $id, $randomString ) {
#----------------------------------------------------------------------

  return sha1( $id . "foobidoo" . $randomString . wcaDate() );
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

  #--- Generate two passwords for the new competition.
  $adminPassword = generateNewPassword( $newCompetitionId, 'foo' );
  $organiserPassword = generateNewPassword( $newCompetitionId, 'bar' );

  #--- First provide id and password ...
  $keys = "id, adminPassword, organiserPassword";
  $values = "'$newCompetitionId', '$adminPassword', '$organiserPassword'";

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

  $name = "NEW COMPETITION " . trim(preg_replace('/(\\d{4})/', ' $1 ', $id));
  $adminPassword = generateNewPassword( $id, 'foo' );
  $organiserPassword = generateNewPassword( $id, 'bar' );
  dbCommand("
    INSERT INTO Competitions ( id, name, cellName, adminPassword, organiserPassword )
    VALUES ( '$id', '$name', '$name', '$adminPassword', '$organiserPassword' )
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
      'SELECT * FROM Events WHERE rank<990 ORDER BY rank',

    'Rounds' =>
      'SELECT * FROM Rounds ORDER BY rank',

    // order these with 'nearby' competitions listed first; helps with ordering select lists.
    'Competitions' =>
      "SELECT id, cellName
       FROM Competitions
       ORDER BY (STR_TO_DATE(CONCAT(year,',',month,',',day),'%Y,%m,%d') BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY)) DESC,
         year DESC, month DESC, day DESC",
      
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

    'UsedCountriesCompetitions' =>
      'SELECT DISTINCT country.*
       FROM Competitions competition, Countries country
       WHERE country.id = countryId
       ORDER BY country.name',

    'UsedYears' =>
      'SELECT DISTINCT year FROM Competitions ORDER BY year DESC'
  );

  #--- Compute and store the caches.
  $handle = fopen( $cacheFile, 'w' );
  fwrite( $handle, "<?php\n\n" );
  foreach( $caches as $name => $query )
    fwrite( $handle, computeCacheEntry( $name, $query ));
  fwrite( $handle, "?>\n" );
  fclose( $handle );
}

#----------------------------------------------------------------------
function computeCacheEntry ( $name, $query ) {
#----------------------------------------------------------------------

  echo "<p>Building cached database entry <b>[</b>$name<b>]</b> ...</p>";

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
