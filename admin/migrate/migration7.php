<?php

# - Set ResultsStatus['migration'] to '5'
#
# - Table "Competitions":
#     - Add latitude and longitude.
# - Table "Countries":
#     - Add latitude, longitude and zoom.
# - Table "Continents":
#     - Add latitude, longitude and zoom.



#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../../_header.php' );
require( '../_helpers.php' );

migrate();

require( '../../_footer.php' );

#----------------------------------------------------------------------
function migrate () {
#----------------------------------------------------------------------


  #--- Leave if we've done this migration already.
  if( ! databaseTableExists( 'ResultsStatus' )){
    noticeBox( false, "You need to apply migation 1 first." );
    return;
  }
  
  #--- Leave if we are already up-to-date
  $number = dbQuery( "
              SELECT value FROM  ResultsStatus
              WHERE  id = 'migration'
  ");
  $number = $number[0]['value'];
  if ($number != '6'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 6");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 7" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '7'
    WHERE  id = 'migration'
  ");


  #--- Apply the migration changes.
  alterTablePersons();
  //convertToUTF8();

  #--- Yippie, we did it!
  noticeBox( true, "Migration completed." );
}

#----------------------------------------------------------------------
function reportAction ( $tableName, $message ) {
#----------------------------------------------------------------------

  echoAndFlush( "<p><b>$tableName: </b>$message...</p>" );
}

#----------------------------------------------------------------------
function alterTablePersons () {
#----------------------------------------------------------------------

  #--- Alter the field set.

  reportAction( "Persons", "Alter field set" );

  dbCommand("
    ALTER TABLE Persons
      ADD    COLUMN `localName`  VARCHAR(80) CHARACTER SET utf8 NOT NULL DEFAULT ''
  ");

}

#----------------------------------------------------------------------
function convertToUTF8 () {
#----------------------------------------------------------------------

  reportAction( "Persons", "Change names to UTF-8" );

  $persons = dbQuery( "SELECT id, name FROM Persons" );
  foreach( $persons as $person ){
    extract( $person );
    $utfname = mysql_real_escape_string(utf8_encode( $name ));
    if( $utfname != $name )
      dbCommand( "UPDATE Persons SET name='$utfname' WHERE id='$id'" );
  }

  reportAction( "Preregs", "Change names to UTF-8" );

  $preregs = dbQuery( "SELECT id, name FROM Preregs" );
  foreach( $preregs as $prereg ){
    extract( $prereg );
    $utfname = mysql_real_escape_string(utf8_encode( $name ));
    if( $utfname != $name )
      dbCommand( "UPDATE Preregs SET name='$utfname' WHERE id='$id'" );
  }

  reportAction( "Results", "Change names to UTF-8" );

  $step = 10000;
  $from = 0;

  $results = dbQuery( "SELECT id, personName FROM Results ORDER BY id LIMIT $from,$step" ); # Can't do it in one query. Too big.
  while( count( $results ) != 0 ){
    foreach( $results as $result ){
      extract( $result );
      $utfname = mysql_real_escape_string(utf8_encode( $personName ));
      if( $utfname != $personName )
        dbCommand( "UPDATE Results SET personName='$utfname' WHERE id='$id'" );
    }
    $from += $step;
    $results = dbQuery( "SELECT id, personName FROM Results ORDER BY id LIMIT $from,$step" );
  }

  reportAction( "Competitions", "Change names to UTF-8" );

  $competitions = dbQuery( "SELECT id, name, cityName, countryId FROM Preregs" );
  foreach( $preregs as $prereg ){
    extract( $prereg );
    $utfname = mysql_real_escape_string(utf8_encode( $name ));
    if( $utfname != $name )
      dbCommand( "UPDATE Preregs SET name='$utfname' WHERE id='$id'" );
  }

}

?>
