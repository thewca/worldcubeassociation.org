<?

#--- Known upper bounds for the top 100, can be lowered from time to time
 $singleBound =  991;
$averageBound = 1181;

#--- Fetch all results that have a chance to be in the top 100
$candidates = dbQuery( "
  SELECT   personId,
           value1, value2, value3, value4, value5,
           average
  FROM     Results
  WHERE    eventId='333' AND (best>0 AND best<=$singleBound OR average>0 AND average<=$averageBound)
" );

#--- Extract (person,single) pairs and (person,average) pairs
foreach ( $candidates as $candidate ) {
  if ( $candidate['average'] > 0 )
    $personAveragePairs[] = array( $candidate['personId'], $candidate['average'] );
  for ( $i=1; $i<=5; $i++ )
    if ( $candidate["value$i"] > 0 )
      $personSinglePairs[] = array( $candidate['personId'], $candidate["value$i"] );
}

#--- Build and add this statistic
$lists[] = array(
  "Appearances in Rubik's Cube top 100 results",
  "Single | Average",
  "[P] Person [N] Appearances [T] | [P] Person [N] Appearances",
  my_merge( countTop100Appearances( $personSinglePairs ),
            countTop100Appearances( $personAveragePairs ) )
);

#--------------------------------------------------------------------------
# helper...
#--------------------------------------------------------------------------

function countTop100Appearances ( $personValuePairs ) {
  usort( $personValuePairs, create_function('$a,$b', 'return $a[1]-$b[1];') );
  for( $i=0; $i<100 || $i<count($personValuePairs) && $personValuePairs[$i][1]==$personValuePairs[$i-1][1]; $i++ )
    $appearances[ $personValuePairs[$i][0] ]++;
  arsort( $appearances );
  foreach( $appearances as $personId => $counter )
    $result[] = array( $personId, $counter );
  return $result;
}

?>
