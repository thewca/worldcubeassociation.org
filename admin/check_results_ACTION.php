<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
adminHeadline( 'Check results', 'check_results' );

showUpdateSQL();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showUpdateSQL () {
#----------------------------------------------------------------------

  echo "<pre>I'm doing this:\n";
  
  foreach( getRawParamsThisShouldBeAnException() as $key => $value ){

    if( preg_match( '/^setround(\w*)\/(\w*)\/(\w*)$/', $key, $match )){
      $competitionId = $match[1];
      $eventId = $match[2];
      $roundId = $match[3];
      $updateRounds[$competitionId][$eventId][$roundId] = $value;
    }

    if( preg_match( '/^confirmround(\w*)\/(\w*)$/', $key, $match )){
      $competitionId = $match[1];
      $eventId = $match[2];
      $updateRounds[$competitionId][$eventId]['confirm'] = 1; // 'confirm' should not be a valid roundId
    }

    if( preg_match( '/^setpos([1-9]\d*)$/', $key, $match ) && preg_match( '/^[1-9]\d*$/', $value )){
      $id = $match[1];
      $command = "UPDATE Results SET pos=$value WHERE id=$id";
      echo "$command\n";
      dbCommand( $command );
    }

    if( preg_match( '/^deleteres([1-9]\d*)$/', $key, $match )){
      $id = $match[1];
      $command = "DELETE FROM Results WHERE id=$id";
      echo "$command\n";
      dbCommand( $command );
    }
  }
 
  foreach( $updateRounds as $competitionId => $eventIds ){
    foreach( $eventIds as $eventId => $roundIds ){
      if( $roundIds['confirm'] != 1 ) continue;
      unset( $roundIds['confirm'] );

      // We have to make the replacement in the right order

      // Remove trivial replacements
      foreach( $roundIds as $roundIdOld => $roundIdNew )
        if( $roundIdOld == $roundIdNew )
          unset( $roundIds[$roundIdOld] );


      foreach( range(0, 5) as $i ){ // Safer to use a for statement

        if( count( $roundIds ) == 0 ) break;

        foreach( $roundIds as $roundIdOld => $roundIdNew ){

          // We can replace a roundId with another one if the new one will not be replaced again
          if( ! in_array( $roundIdNew, array_keys( $roundIds ))){ 

            // Replace
            $command = "UPDATE Results
                        SET roundId='$roundIdNew'
                        WHERE competitionId='$competitionId'
                          AND eventId='$eventId'
                          AND roundId='$roundIdOld'";
            echo "$command\n";
            dbCommand( $command );

            unset( $roundIds[$roundIdOld] ); // Remove from the list of replacements
          }
        }
      }

      if( $i == 5 ) noticeBox( false, "Found a loop for competition $competitionId and event $eventId" );

    }
  } 
  echo "\nFinished.</pre>\n";
}

?>
