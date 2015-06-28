<?php

#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../../includes/_header.php' );
require( '../_helpers.php' );

migrate();

require( '../../includes/_footer.php' );

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
  if ($number != '8'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 8");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 9" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '9'
    WHERE  id = 'migration'
  ");


  #--- Apply the migration changes.
  alterTablePreregs();

  #--- Yippie, we did it!
  noticeBox( true, "Migration completed." );
}

#----------------------------------------------------------------------
function reportAction ( $tableName, $message ) {
#----------------------------------------------------------------------

  echoAndFlush( "<p><b>$tableName: </b>$message...</p>" );
}

#----------------------------------------------------------------------
function alterTablePreregs () {
#----------------------------------------------------------------------

  #--- Alter the field set.

  reportAction( "Preregs", "Alter field set" );

  dbCommand("
    ALTER TABLE Preregs
      ADD    COLUMN `eventIds`  TEXT NOT NULL DEFAULT ''
  ");

  $i = 0;
  $len = 1000;

  $preregs = dbQuery(" SELECT * FROM Preregs LIMIT $i,$len");
  while ( count( $preregs ) != 0 ) {
    foreach( $preregs as $prereg ){
      $id = $prereg['id'];
      $eventIds = '';
      foreach( array_merge( getAllEventIds(), getAllUnofficialEventIds() ) as $eventId )
        if( $prereg["E$eventId"] != 0 )
          $eventIds .= "$eventId ";

      rtrim( $eventIds );
      dbCommand("UPDATE Preregs SET eventIds='$eventIds' WHERE id='$id'");
    }
    $i += $len;
    $preregs = dbQuery(" SELECT * FROM Preregs LIMIT $i,$len");
  } 


  foreach( array_merge( getAllEventIds(), getAllUnofficialEventIds() ) as $eventId )
    dbCommand("ALTER TABLE Preregs
                 DROP COLUMN `E$eventId`");

}

?>
