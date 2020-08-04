<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
adminHeadline( 'Check rounds', 'check_rounds' );

showUpdateSQL();

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showUpdateSQL () {
#----------------------------------------------------------------------

  echo "<pre>I'm doing this:\n";

  foreach( getRawParamsThisShouldBeAnException() as $key => $value ){

    if( preg_match( '/^setround(\w*)\/(\w*)\/(\w*)$/', $key, $match )){
      $competitionId = $match[1];
      $eventId = $match[2];
      $roundTypeId = $match[3];
      $updateRounds[$competitionId][$eventId][$roundTypeId] = $value;
    }

    if( preg_match( '/^confirmround(\w*)\/(\w*)$/', $key, $match )){
      $competitionId = $match[1];
      $eventId = $match[2];
      $updateRounds[$competitionId][$eventId]['confirm'] = 1; // 'confirm' should not be a valid roundTypeId
    }

    if (preg_match('/^removeevent(\w*)\/(\w*)$/', $key, $match)) {
      $competitionId = $match[1];
      $eventId = $match[2];
      $removeEvents[$competitionId][] = $eventId;
    }

    if (preg_match('/^addevent(\w*)\/(\w*)$/', $key, $match)) {
      $competitionId = $match[1];
      $eventId = $match[2];
      $addEvents[$competitionId][] = $eventId;
    }

    if( preg_match( '/^deleteres([1-9]\d*)$/', $key, $match )){
      $id = $match[1];
      $command = "DELETE FROM Results WHERE id=$id";
      echo "$command\n";
      dbCommand( $command );
    }
  }

  foreach( $removeEvents as $competitionId => $eventIds ){
    foreach( $eventIds as $eventId ) {
      $competitionEventId = dbValue("SELECT id FROM competition_events WHERE competition_id='$competitionId' AND event_id = '$eventId'");
      if( $competitionEventId ){
        $command = "DELETE FROM competition_events WHERE id=$competitionEventId";
        echo "$command\n";
        dbCommand($command);
        $command = "DELETE FROM rounds WHERE competition_event_id=$competitionEventId";
        echo "$command\n";
        dbCommand($command);
        $command = "DELETE FROM registration_competition_events WHERE competition_event_id=$competitionEventId";
        echo "$command\n";
        dbCommand($command);
        $command = "DELETE FROM wcif_extensions WHERE extendable_type = 'CompetitionEvent' and extendable_id=$competitionEventId";
        echo "$command\n";
        dbCommand($command);
      }
    }
  }

  foreach ($addEvents as $competitionId => $eventIds) {
    foreach ($eventIds as $eventId) {
      $command = "INSERT INTO competition_events (id, competition_id, event_id) VALUES (NULL, '$competitionId', '$eventId')";
      echo "$command\n";
      dbCommand($command);
    }
  }

  foreach( $updateRounds as $competitionId => $eventIds ){
    foreach( $eventIds as $eventId => $roundTypeIds ){
      if( $roundTypeIds['confirm'] != 1 ) continue;
      unset( $roundTypeIds['confirm'] );

      // We have to make the replacement in the right order

      // Remove trivial replacements
      foreach( $roundTypeIds as $roundTypeIdOld => $roundTypeIdNew )
        if( $roundTypeIdOld == $roundTypeIdNew )
          unset( $roundTypeIds[$roundTypeIdOld] );

      // Delete rounds
      foreach( $roundTypeIds as $roundTypeIdOld => $roundTypeIdNew )
        if( $roundTypeIdNew == 'del' ){
          $command = "DELETE FROM Results
                      WHERE competitionId='$competitionId'
                        AND eventId='$eventId'
                        AND roundTypeId='$roundTypeIdOld'";
          echo "$command\n";
          dbCommand( $command );

          unset( $roundTypeIds[$roundTypeIdOld] );
        }

      foreach( range(0, 5) as $i ){ // Safer to use a for statement

        if( count( $roundTypeIds ) == 0 ) break;

        foreach( $roundTypeIds as $roundTypeIdOld => $roundTypeIdNew ){

          // We can replace a roundTypeId with another one if the new one will not be replaced again
          if( ! in_array( $roundTypeIdNew, array_keys( $roundTypeIds ))){

            // Replace in Results table
            $command = "UPDATE Results
                        SET roundTypeId='$roundTypeIdNew'
                        WHERE competitionId='$competitionId'
                          AND eventId='$eventId'
                          AND roundTypeId='$roundTypeIdOld'";
            echo "$command\n";
            dbCommand( $command );

            // Replace in Scrambles table (will do nothing if scrambles for a competition are not available)
            $command = "UPDATE Scrambles
                        SET roundTypeId='$roundTypeIdNew'
                        WHERE competitionId='$competitionId'
                          AND eventId='$eventId'
                          AND roundTypeId='$roundTypeIdOld'";
            echo "$command\n";
            dbCommand( $command );

            unset( $roundTypeIds[$roundTypeIdOld] ); // Remove from the list of replacements
          }
        }
      }

      if( $i == 5 ) noticeBox( false, "Found a loop for competition $competitionId and event $eventId" );

    }
  }
  echo "\nFinished.</pre>\n";
}

?>
