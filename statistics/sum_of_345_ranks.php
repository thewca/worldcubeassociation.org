<?

$single = combinedRanking( 'best', 'Single' );
$average = combinedRanking( 'average', 'Average' );

$lists[] = array(
  "Sum of 3x3/4x4/5x5 ranks",
  "since $sinceDateHtml - Single and Average",
  "[P] Person [N] Sum [n] 3x3 [n] 4x4 [n] 5x5 [T] | [P] Person [N] Sum [n] 3x3 [n] 4x4 [n] 5x5",
  my_merge( $single, $average )
);

#----------------------------------------------------------------------
function combinedRanking ( $sourceId, $sourceName ) {
#----------------------------------------------------------------------
  global $sinceDateCondition;
  
  $ranks3 = eventRankList( '333', $sinceDateCondition, $sourceId, $sourceName );
  $ranks4 = eventRankList( '444', $sinceDateCondition, $sourceId, $sourceName );
  $ranks5 = eventRankList( '555', $sinceDateCondition, $sourceId, $sourceName );
  $personIds = array_intersect( array_keys( $ranks3 ), array_keys( $ranks4 ), array_keys( $ranks5 ));
  foreach( $personIds as $personId ){
    $r3 = $ranks3[$personId];
    $r4 = $ranks4[$personId];
    $r5 = $ranks5[$personId];
    $rows[] = array( $personId . '-' . currentPersonName( $personId ), $r3+$r4+$r5, $r3, $r4, $r5 );
  }
  usort( $rows, 'comparePersonRanks' );
  return array_slice( $rows, 0, 10 );
}

#----------------------------------------------------------------------
function eventRankList ( $eventId, $dateCondition, $sourceId, $sourceName ) {
#----------------------------------------------------------------------
  global $WHERE;
  
  #--- Get the unranked list (i.e. just ordered personId/value tuples).
  $unrankeds = dbQuery("
    SELECT personId, min($sourceId) value
    FROM Concise${sourceName}Results
    $WHERE 1
      AND eventId='$eventId'
      AND $dateCondition
      AND $sourceId>0
    GROUP BY personId
    ORDER BY value, personId
  ");

  foreach( $unrankeds as $unranked ){
    extract( $unranked );

    $ctr++;
    if( $value != $previousValue )
      $rank = $ctr;
    $previousValue = $value;

    $ranked[$personId] = $rank;
  }

  return $ranked;
}

#----------------------------------------------------------------------
function comparePersonRanks ( $a, $b ) {
#----------------------------------------------------------------------

  foreach( range( 1, 4 ) as $i ){
    $diff = $a[$i] - $b[$i];
    if( $diff )
      return $diff;
  }
}

?>
