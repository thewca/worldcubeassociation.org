<?

#--- The age bounds make it faster, can be updated once in a while
$lists[] = youngestAndOldest( '333', '3x3', 6, 65 );
$lists[] = youngestAndOldest( '333bf', '3x3 blindfolded', 13, 45 );

#----------------------------------------------------------------------
function youngestAndOldest ( $eventId, $eventTitle, $maxAgeForYoungest, $minAgeForOldest ) {
#----------------------------------------------------------------------

  #--- Get all persons and their first and last success dates
  $persons = dbQuery( "
    SELECT
      personId,
      datediff(first DIV 1000000,year*10000+month*100+day) firstAgeInDays,
      datediff(last  DIV 1000000,year*10000+month*100+day)  lastAgeInDays,
      first DIV 1000000 firstCompetitionDate,
      last  DIV 1000000  lastCompetitionDate,
      first % 1000000     firstBest,
      999999-last%1000000  lastBest,
      year*10000+month*100+day birthDate
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
    if ( $p['firstAgeInDays'] < ($maxAgeForYoungest+1)*365 )
      $youngest[] = array( $p['personId'], $p['firstAgeInDays'], $p['firstBest'], $p['birthDate'], $p['firstCompetitionDate'] );
    if ( $p[ 'lastAgeInDays'] >= $minAgeForOldest*365 )
      $oldest[]   = array( $p['personId'], $p[ 'lastAgeInDays'], $p[ 'lastBest'], $p['birthDate'], $p[ 'lastCompetitionDate'] );
  }

  #--- Sort by ageInDays and best
  usort( $youngest, create_function( '$a,$b', 'return $a[1]-$b[1] ? $a[1]-$b[1] : $a[2]-$b[2];' ) );
  usort( $oldest,   create_function( '$a,$b', 'return $a[1]-$b[1] ? $b[1]-$a[1] : $a[2]-$b[2];' ) );

  #--- Build and return the statistic list
  return array(
    "Youngest and oldest $eventTitle solvers",
    "we don't know everybody's birthdate but the #1 persons should be correct",
    "[P] Person [N] Years [n] Months [n] Days [R] Time [T] | [P] Person [N] Years [n] Months [n] Days [R] Time",
    my_merge( formatTop10YoungestAndOldest( $youngest ),
              formatTop10YoungestAndOldest( $oldest   ) ) );
}

#----------------------------------------------------------------------
function formatTop10YoungestAndOldest ( $all ) {
#----------------------------------------------------------------------

  for( $i=0; $i<10; $i++ ){
    list( $personId, $ageInDays, $best, $birthDate, $competitionDate ) = $all[$i];
    list( $years, $months, $days ) = dateDiff2( $birthDate, $competitionDate );
      $result[] = array( $personId, $years, $months, $days, $best );
  }
  return $result;
}

#----------------------------------------------------------------------
function dateDiff2 ( $date1, $date2 ) {
#----------------------------------------------------------------------

  return dateDiff( floor($date1/10000), floor($date1/100)%100, $date1%100,
                   floor($date2/10000), floor($date2/100)%100, $date2%100 );
}

#----------------------------------------------------------------------
function dateDiff ( $y1, $m1, $d1, $y2, $m2, $d2 ) {
#----------------------------------------------------------------------

  #--- Combine the dates to one nice value each.
  $date1 = 1200*$y1 + 100*($m1-1) + $d1;
  $date2 = 1200*$y2 + 100*($m2-1) + $d2;

  #--- Compute years, adapt date1.
  $years = floor(($date2 - $date1) / 1200);
  $date1 += 1200*$years;

  #--- Compute months, adapt date1.
  $months = floor(($date2 - $date1) / 100);
  $date1 += 100*$months;

  #--- Compute days.
  $days = $d2 - $d1;
  if( $days < 0 )
    $days += daysOfMonth( floor( $date1/1200 ), floor( $date1/100 ) % 12 + 1 );

  #--- Answer.
  return array( $years, $months, $days );
}

#----------------------------------------------------------------------
function daysOfMonth ( $year, $month ) {
#----------------------------------------------------------------------

  $days = array( 0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 );
  $days = $days[$month];
  if( $days == 28 )
    $days += ($year % 4 == 0) && ($year % 100 > 0) || ($year % 400 == 0);
  return $days;
}

?>