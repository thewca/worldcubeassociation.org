<?php

$lists[] = array(
  "podiums_3x3",
  "Best Podiums in Rubik's Cube event",
  "",
  "[C] Competition [R] Sum [P] First [r] &nbsp; [P] Second [r] &nbsp; [P] Third [r] &nbsp;",
  bestPodiums()
);

#----------------------------------------------------------------------
function bestPodiums () {
#----------------------------------------------------------------------
  $results = dbQuery( "SELECT average, competitionId, personId, pos
                       FROM Results
                       WHERE pos<=3 AND eventId='333' AND formatId='a' AND average>0 AND roundTypeId in ('f','c')
                       ORDER BY competitionId, roundTypeId, pos ");

  foreach( structureBy( $results, 'competitionId' ) as $top3 )
    if( count( $top3 ) >= 3 )
      $list[] = array( $top3[0]['competitionId'], $top3[0]['average'] + $top3[1]['average'] + $top3[2]['average'],
                       $top3[0]['personId'],      $top3[0]['average'],
                       $top3[1]['personId'],      $top3[1]['average'],
                       $top3[2]['personId'],      $top3[2]['average'] );

  uasort( $list, 'comparePodiums' );
  return array_slice( $list, 0, 10 );
}

#----------------------------------------------------------------------
function comparePodiums ( $a, $b ) {
#----------------------------------------------------------------------

  return ($a[1] > $b[1]);
}

?>
