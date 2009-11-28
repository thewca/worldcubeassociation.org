<?

#--- Get the blindfold results since one year ago
$sources = dbQuery( "
  SELECT personId,
         value1, value2, value3, value4, value5
  FROM   Results r, Competitions competition
  WHERE  eventId='333bf' AND competition.id=competitionId AND $sinceDateCondition
" );

#--- For each person, count the attempts and collect the success times
foreach ( $sources as $source ) {
  $personId = $source['personId'];
  for ( $i=1; $i<=5; $i++ ) {
    $value = $source["value$i"];
    if ( $value > 0 || $value == -1 ) $attempts[$personId]++;
    if ( $value > 0                 ) $validTimes[$personId][] = $value;
  }
}

#--- Build the rows (person, rate, attempts, solve, spacer, best, average, worst)
foreach ( $validTimes as $personId => $times ) {
  if ( $attempts[$personId] >= 5 ) {
    $rows[] = array( $personId,
                      sprintf( "%.2f %%", 100 * count($times) / $attempts[$personId] ),
                      count($times),
                      $attempts[$personId],
                      '',
                      min($times),
                      array_sum($times) / count($times),
                      max($times) );
  }
}

#--- Sort the rows, keep only top 10
usort( $rows, "rowComparison" );
array_splice( $rows, 10 );

#--- Helper function for sorting rows by (rate,attempts) 
function rowComparison ( $a, $b ) {
  list( $attemptsA, $solvesA ) = array( $a[2], $a[3] );
  list( $attemptsB, $solvesB ) = array( $b[2], $b[3] );
  if ( $solvesA/$attemptsA > $solvesB/$attemptsB ) return 1;
  if ( $solvesA/$attemptsA < $solvesB/$attemptsB ) return -1;
  return $attemptsB - $attemptsA;
}

#--- Add this statistic to the statistics collection
$lists[] = array(
  "Blindfold 3x3x3 recent success rate",
  "since $sinceDateHtml - minimum 5 attempts",
  "[P] Person [N] Rate [n] Solves [n] Attempts [t] &nbsp; [r] Best [r] Avg [r] Worst",
  $rows
);

?>
