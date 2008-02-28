<?

#--- Get all persons and their success dates.
$persons = dbQuery("
  SELECT
    person.*,
    datediff( concat( competitionYear, '-', competitionMonth, '-', competitionDay ),
              concat( birthYear, '-', birthMonth, '-', birthDay )) ageInDays
  FROM
    (SELECT DISTINCT
        personId id, personName name,
        min(best) best,
        person.year birthYear, person.month birthMonth, person.day birthDay,
        competition.year competitionYear, competition.month competitionMonth, competition.day competitionDay
      FROM
        Results result, Persons person, Competitions competition
      $WHERE 1
        AND eventId = '333'
        AND result.best > 0
        AND person.id = result.personId
        AND competition.id = result.competitionId
        AND person.year > 0
      GROUP BY
        personId, personName, competitionId
    ) person
  ORDER BY
    ageInDays, best
");

$youngest = getFirstTen( $persons );
$oldest = getFirstTen( array_reverse( $persons ));

$lists[] = array(
  "Youngest and oldest 3x3 solvers",
  "we don't know everybody's birth dates but the #1 persons should be correct",
#  "[P] Person [N] Age in days [n] Years [n] Months [n] Days [T] | [P] Person [N] Age in days [n] Years [n] Months [n] Days",
  "[P] Person [N] Years [n] Months [n] Days [R] Time [T] | [P] Person [N] Years [n] Months [n] Days [R] Time",
  my_merge( $youngest, $oldest )
);

#----------------------------------------------------------------------
function getFirstTen ( $persons ) {
#----------------------------------------------------------------------
  global $WHERE;
  
  #--- Collect the first ten unique persons.
  foreach( $persons as $person ) {
    extract( $person );
    
    if( $done[$id] )
      continue;
    $done[$id] = 1;
    
    list( $y, $m, $d ) = dateDiff(
      $birthYear, $birthMonth, $birthDay,
      $competitionYear, $competitionMonth, $competitionDay
    );
    
#    $result[] = array( "$id-$name", $ageInDays, $y, $m, $d );
    $result[] = array( "$id-$name", $y, $m, $d, $best );
    if( count( $result ) == 10 )
      break;
  }
  
  #--- Answer.
  return $result;
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
