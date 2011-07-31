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
                      '<span style="color:#0C0">' . formatValue(min($times)) . '</span>',
                      array_sum($times) / count($times),
                      '<span style="color:#E00">' . formatValue(max($times)) . '</span>' );
  }
}

#--- Sort the rows, keep only top 10
usort( $rows, "rowComparison" );
array_splice( $rows, 10 );

#--- Helper function for sorting rows by (rate,attempts) 
function rowComparison ( $a, $b ) {
  list( $solvesA, $attemptsA, $averageA ) = array( $a[2], $a[3], $a[6] );
  list( $solvesB, $attemptsB, $averageB ) = array( $b[2], $b[3], $b[6] );
  #--- Compare solvesA/attemptsA with solvesB/attemptsB, but multiply to prevent rounding errors
  if ( $solvesA*$attemptsB > $solvesB*$attemptsA ) return -1;
  if ( $solvesA*$attemptsB < $solvesB*$attemptsA ) return 1;
  #--- Same rate? Then who has more attempts?
  if ( $attemptsA != $attemptsB ) return $attemptsB - $attemptsA;
  #--- Still the same? Then better average wins (if even same average, I don't care anymore)
  return ($averageA < $averageB) ? -1 : 1; 
}

#--- Add this statistic to the statistics collection
$lists[] = array(
  "Rubik's Cube Blindfolded recent success rate",
  "since $sinceDateHtml - minimum 5 attempts",
  "[P] Person [N] Rate [n] Solves [n] Attempts [t] &nbsp; [r] Best [r] Avg [r] Worst",
  $rows
);

?>
