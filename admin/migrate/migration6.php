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
  if ($number != '5'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 5");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 6" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '6'
    WHERE  id = 'migration'
  ");


  #--- Apply the migration changes.
  moveOldMulti();
    
  #--- Yippie, we did it!
  noticeBox( true, "Migration completed." );
}

#----------------------------------------------------------------------
function reportAction ( $tableName, $message ) {
#----------------------------------------------------------------------

  echoAndFlush( "<p><b>$tableName: </b>$message...</p>" );
}

#----------------------------------------------------------------------
function moveOldMulti () {
#----------------------------------------------------------------------

  #--- Alter the field set.
  reportAction( "Results", "Move" );
  $results = dbQuery(" SELECT * FROM Results WHERE eventId='333mbo' ");
 
  foreach( $results as $result ){
    $oneGood = false;
    $theBest = 0;
    $values = array( 0, 0, 0 );
    foreach( range( 1, $result['formatId'] ) as $n ){

      $value = $result["value$n"];
      if( $value <= 0 ){
        $values[$n] = $value;
        continue;
      }

      $old = intval( $value / 1000000000);

      if ( $old ) {
        $time       = $value % 100000; $value = intval( $value / 100000 );
        $attempted  =      $value % 100; $value = intval( $value / 100 );
        $solved     = 99 - $value % 100; $value = intval( $value / 100 );
        $difference = 2 * $solved - $attempted;
      }

      else {
        $missed     = $value % 100; $value = intval( $value / 100 );
        $time       = $value % 100000; $value = intval( $value / 100000 );
        $difference = 99 - $value % 100;
        $solved     = $difference + $missed;
        $attempted  = $solved + $missed;
      }

      if(( $time <= 3600 ) && ( $time <= ( 600 * $attempted )) && ( $difference >= 0 )){
        $oneGood = true;

        $missed = $attempted - $solved;
        $difference = $solved - $missed;
        $value = 99 - $difference;
        $value = $value * 100000 + $time;
        $value = $value * 100 + $missed;

        $values[$n] = $value;

        if( $theBest > 0 )
          $theBest = min( $theBest, $value );
        else
          $theBest = $value;
      }

      else
        $values[$n] = -2;

    }

    if( $oneGood ){
      extract( $result );
      dbCommand(" INSERT INTO Results (pos, personId, personName, countryId, competitionId, eventId, roundId, formatId, value1, value2, value3, value4, value5, best, average, regionalSingleRecord, regionalAverageRecord)
                  VALUES ('$pos', '$personId', '$personName', '$countryId', '$competitionId', '333mbf', '$roundId', '$formatId', '$values[1]', '$values[2]', '$values[3]', '0', '0', '$theBest', '$average', '$regionalSingleRecord', '$regionalAverageRecord')" );
    }

  }

}

?>
