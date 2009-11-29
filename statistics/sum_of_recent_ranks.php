<?

#--- Get event ranks
$ranksSingle  = getRecentRanks( 'best'    );
$ranksAverage = getRecentRanks( 'average' );

#--- Sum of 3x3/4x4/5x5 ranks, single and average
list( $single  ) = sumOfRecentRanks( 'Single',  array( '333', '444', '555' ), $ranksSingle   );
list( $average ) = sumOfRecentRanks( 'Average', array( '333', '444', '555' ), $ranksAverage );
$lists[] = array(
  "Sum of recent 3x3/4x4/5x5 ranks",
  "Single | Average - considering results since $sinceDateHtml",
  "[P] Person [N] Sum [n] 3x3 [n] 4x4 [n] 5x5 [T] | [P] Person [N] Sum [n] 3x3 [n] 4x4 [n] 5x5",
  my_merge( $single, $average )
);

#--- Sum of all single ranks
list( $rows, $header ) = sumOfRecentRanks( 'Single',  getAllEventIds(), $ranksSingle   );
$lists[] = array( "Sum of recent single ranks",  "considering results since $sinceDateHtml", $header, $rows );

#--- Sum of all average ranks
list( $rows, $header ) = sumOfRecentRanks( 'Average', getAllEventIds(), $ranksAverage );
$lists[] = array( "Sum of recent average ranks", "considering results since $sinceDateHtml", $header, $rows );

#----------------------------------------------------------------------
function getRecentRanks ( $sourceId ) {
#----------------------------------------------------------------------
  global $WHERE, $sinceDateCondition;

  #--- Get all personal records sorted by event and value
  $records = dbQuery( "
    SELECT   personId, eventId, min($sourceId) value
    FROM     Results result, Competitions competition
    $WHERE   competition.id=competitionId
      AND    $sinceDateCondition
      AND    $sourceId>0
    GROUP BY eventId, personId
    ORDER BY eventId, value
  " );

  #--- Append a sentinel
  $records[] = array( 'nobody', 'ThisWillCauseTheFinishEventCodeForTheLastEvent' );

  #--- Process the personal records, build ranks[event][person]
  foreach ( $records as $record ) {
    list( $personId, $eventId, $value ) = $record;

    #--- At new events, finish the previous and reset for the new one
    if ( $eventId != $currentEventId ) {

      #--- Memorize the previous event's ranks (if any, and if that event is official)
      if ( $currentEventId && in_array( $currentEventId, getAllEventIds() ) )
        $ranks[$currentEventId] = $ranksInCurrentEvent;

      #--- Reset for the new event
      $currentEventId = $eventId;
      unset( $currentSize, $currentRank, $currentValue, $ranksInCurrentEvent );
    }

    #--- Update the current event ranklist status
    $currentSize++;
    if ( $value != $currentValue ) {
      $currentValue = $value;
      $currentRank = $currentSize;
    }

    #--- Memorize the person's rank in this event
    $ranksInCurrentEvent[$personId] = $currentRank;
  }

  #--- Return the event ranks
  return $ranks;
}

#----------------------------------------------------------------------
function sumOfRecentRanks ( $sourceName, $eventIds, $ranks ) {
#----------------------------------------------------------------------

  #--- Compute the event-missing penalties and their sum
  foreach ( $eventIds as $eventId )
    if ( $ranks[$eventId] )
      $allPenalties += $penalty[$eventId] = count( $ranks[$eventId] ) + 1;

  #--- Compute everybody's sum of ranks
  foreach ( $eventIds as $eventId )
    if ( $ranks[$eventId])
      foreach ( $ranks[$eventId] as $personId => $rank )
          $rankSum[$personId] += $rank - $penalty[$eventId];
  foreach ( array_keys( $rankSum ) as $personId )
    $rankSum[$personId] += $allPenalties;

  #--- Sort persons by their sum of ranks
  asort( $rankSum );

  #--- Prepare the top 10 sum persons for output
  foreach ( array_slice( $rankSum, 0, 10 ) as $personId => $sum ) {
    $row = array( $personId, $sum );
    foreach ( $eventIds as $eventId ) {
      if ( $penalty[$eventId] )
        $row[] = $ranks[$eventId][$personId]
               ? $ranks[$eventId][$personId]
               : "<span style='color:#F00'>" . $penalty[$eventId] . "</span>";
    }
    $rows[] = $row;
  }

  #--- Prepare the statistic header
  $header = "[P] Person [N] Sum [T]";
  foreach ( $eventIds as $eventId ) {
    $e = preg_replace( '/333(.+)/e', 'strtoupper($1)', $eventId );
    $e = str_replace( array('minx','pyram','clock','mmagic','magic','444bf','555bf'), array('meg','pyr','clo','mma','mag','4BF','5BF'), $e );
    if ( $penalty[$eventId] )
      $header .= " [n] $e";
  }

  #--- Return content and header
  return array( $rows, $header );
}

?>