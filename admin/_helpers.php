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
      organiser, venue, venueAddress, venueDetails, eventSpecs
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

?>
