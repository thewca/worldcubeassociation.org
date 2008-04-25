<?

$single = combinedAllRanking( 'best', 'Single' );
$average = combinedAllRanking( 'average', 'Average' );

$lists[] = array(
  "Sum of all ranks",
  "since $sinceDateHtml - Single and Average",
  "[P] Person [N] Sum [T] | [P] Person [N] Sum",
  my_merge( $single, $average )
);

#----------------------------------------------------------------------
function combinedAllRanking ( $sourceId, $sourceName ) {
#----------------------------------------------------------------------
  global $sinceDateCondition;
  
  foreach( getAllEvents() as $event )
    $ranks[$event['id']] = eventAllRankList( $event['id'], $sinceDateCondition, $sourceId, $sourceName );

  $personIds = array_keys( $ranks['333'] );// We can assume that the 10 first have done 3x3x3

  foreach( $personIds as $personId ){
    $r = 0;
    foreach( getAllEvents() as $event ){
      if ( array_key_exists( $personId, $ranks[$event['id']] ))
        $r += $ranks[$event['id']][$personId];
      else
        $r += $ranks[$event['id']]['maxrank'];
    }
    $rows[] = array( $personId . '-' . currentPersonName( $personId ), $r );
  }
  usort( $rows, 'comparePersonAllRanks' );
  return array_slice( $rows, 0, 10 );
}

#----------------------------------------------------------------------
function eventAllRankList ( $eventId, $dateCondition, $sourceId, $sourceName ) {
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
  if ( count($unrankeds) == 0 )
    $ranked['maxrank'] = 0;
  else
    $ranked['maxrank'] = $ctr + 1;
  return $ranked;
}

#----------------------------------------------------------------------
function comparePersonAllRanks ( $a, $b ) {
#----------------------------------------------------------------------

  return ($a[1] > $b[1] || ($a[1] == $b[1] && $a[0] > $b[0]));
}

?>
