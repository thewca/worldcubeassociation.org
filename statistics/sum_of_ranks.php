<?

#--- Get event ranks
$ranksSingle  = getRanks( 'Single'  );
$ranksAverage = getRanks( 'Average' );

#--- Sum of 3x3/4x4/5x5 ranks, single and average
list( $single  ) = sumOfRanks( 'Single',  array( '333', '444', '555' ), $ranksSingle   );
list( $average ) = sumOfRanks( 'Average', array( '333', '444', '555' ), $ranksAverage );
$lists[] = array(
  "sum_ranks_345",
  "Sum of 3x3/4x4/5x5 ranks",
  "Single | Average",
  "[P] Person [N] Sum [n] 3x3 [n] 4x4 [n] 5x5 [T] | [P] Person [N] Sum [n] 3x3 [n] 4x4 [n] 5x5",
  my_merge( $single, $average )
);

#--- Sum of all single ranks
list( $rows, $header ) = sumOfRanks( 'Single',  getAllEventIds(), $ranksSingle  );
$lists[] = array( "sum_ranks_single", "Sum of all single ranks", "", $header, $rows );

#--- Sum of all average ranks
list( $rows, $header ) = sumOfRanks( 'Average', getAllEventIds(), $ranksAverage );
$lists[] = array( "sum_ranks_average", "Sum of all average ranks", "", $header, $rows );

#----------------------------------------------------------------------
function getRanks ( $sourceName ) {
#----------------------------------------------------------------------

  #--- Process the personal records, build ranks[event][person]
  foreach( dbQuery( "SELECT eventId, personId, worldRank FROM Ranks$sourceName" ) as $row )
    $ranks[ $row[0] ][ $row[1] ] = $row[2];

  #--- Return the event ranks
  return $ranks;
}

#----------------------------------------------------------------------
function sumOfRanks ( $sourceName, $eventIds, $ranks ) {
#----------------------------------------------------------------------

  #--- Compute the event-missing penalties and their sum
  $allPenalties = 0;
  foreach ( $eventIds as $eventId )
    if ( isset( $ranks[$eventId] ))
      $allPenalties += $penalty[$eventId] = count( $ranks[$eventId] ) + 1;

  #--- Compute everybody's sum of ranks
  foreach ( $eventIds as $eventId )
    if ( isset( $ranks[$eventId] ))
      foreach ( $ranks[$eventId] as $personId => $rank ){
        if( ! isset( $rankSum[$personId] ))
	  $rankSum[$personId] = 0;
        $rankSum[$personId] += $rank - $penalty[$eventId];
      }
  foreach ( array_keys( $rankSum ) as $personId )
    $rankSum[$personId] += $allPenalties;

  #--- Sort persons by their sum of ranks
  asort( $rankSum );

  #--- Prepare the top 10 sum persons for output
  foreach ( array_slice( $rankSum, 0, 10 ) as $personId => $sum ) {
    $row = array( $personId, $sum );
    foreach ( $eventIds as $eventId ) {
      if ( isset( $penalty[$eventId] ))
        $row[] = isset( $ranks[$eventId][$personId] )
               ? $ranks[$eventId][$personId]
               : "<span style='color:#F00'>" . $penalty[$eventId] . "</span>";
    }
    $rows[] = $row;
  }

  #--- Prepare the statistic header
  $header = "[P] Person [N] Sum [T]";
  foreach ( $eventIds as $eventId ) {
    $e = preg_replace( '/333(.+)/e', 'strtoupper("$1")', $eventId );
    $e = str_replace( array('minx','pyram','clock','mmagic','magic','444bf','555bf'), array('meg','pyr','clo','mma','mag','4BF','5BF'), $e );
    if ( isset( $penalty[$eventId] ))
      $header .= " [n] $e";
  }

  #--- Return content and header
  return array( $rows, $header );
}

?>
