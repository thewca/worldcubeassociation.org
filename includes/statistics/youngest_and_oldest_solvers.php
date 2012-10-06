<?

#--- The age bounds make it faster, can be updated once in a while
$lists[] = youngestAndOldest( '333', "Rubik's Cube", 5, 75 );
$lists[] = youngestAndOldest( '333bf', "Rubik's Cube blindfolded", 12, 50 );
$lists[] = youngestAndOldest( 'magic', 'Magic', 6, 49 );

#----------------------------------------------------------------------
function youngestAndOldest ( $eventId, $eventTitle, $maxAgeForYoungest, $minAgeForOldest ) {
#----------------------------------------------------------------------

  #--- Get all persons and their first and last success dates
  $persons = dbQuery( "
    SELECT
      personId,
      datediff(first DIV 1000000,year*10000+month*100+day)/365.25 firstAge,
      datediff(last  DIV 1000000,year*10000+month*100+day)/365.25 lastAge,
      first % 1000000     firstBest,
      999999-last%1000000  lastBest
    FROM
      ( SELECT personId,
               min(((year*100+   month)*100+   day)*1000000+        best ) first,
               max(((year*100+endMonth)*100+endDay)*1000000+(999999-best)) last
        FROM   Results, Competitions competition
        WHERE  eventId='$eventId' AND best>0
          AND  competition.id=competitionId
        GROUP  BY personId ) helper,
      Persons person
    WHERE
      person.id=personId AND year>1900 AND month>0 and day>0
  " );

  #--- Create (personId, ageInDays, best, birthDate, competitionDate) tuples
  foreach ( $persons as $p ) {
    if ( $p['firstAge'] < $maxAgeForYoungest )
      $youngest[] = array( $p['personId'], $p['firstAge'], $p['firstBest'] );
    if ( $p[ 'lastAge'] >= $minAgeForOldest )
      $oldest[]   = array( $p['personId'], $p[ 'lastAge'], $p[ 'lastBest'] );
  }

  #--- Sort by ageInDays and best
  usort( $youngest, create_function( '$a,$b', 'return $a[1]!=$b[1] ? ($a[1]<$b[1] ? -1 : 1) : $a[2]-$b[2];' ) );
  usort( $oldest,   create_function( '$a,$b', 'return $a[1]!=$b[1] ? ($a[1]>$b[1] ? -1 : 1) : $a[2]-$b[2];' ) );

  #--- Build and return the statistic list
  return array(
    "youngest_oldest_$eventId",
    "Youngest and oldest $eventTitle solvers",
    '',
    "[P] Person [N] Age [r] Time [T] | [P] Person [N] Age [r] Time",
    my_merge( formatTop10YoungestAndOldest( $youngest ),
              formatTop10YoungestAndOldest( $oldest   ) ),
    "We don't know everybody's birthdates, but hopefully most of the very young and very old. They might be more inclined to tell, partly because others are curious and because some competitions even award youngest and oldest competitors." );
}

#----------------------------------------------------------------------
function formatTop10YoungestAndOldest ( $all ) {
#----------------------------------------------------------------------

  for( $i=0; $i<10; $i++ ){
    list( $personId, $age, $best ) = $all[$i];
    $result[] = array( $personId, sprintf('%.1f', $age), $best );
  }
  return $result;
}

?>
