<?

add_blindfold_333_consecutive_successes();

function add_blindfold_333_consecutive_successes () {
  global $lists, $WHERE;
  
  #--- Get ...
  $results = dbQuery("
    SELECT personName, personId, value1, value2, value3, value4, value5
    FROM Results result, Competitions competition
    $WHERE 1
      AND eventId = '333bf'
      AND competition.id = competitionId
    ORDER BY personId, year, month, day, roundId
  ");
  
  foreach( structureBy( $results, 'personId' ) as $personResults ){
    extract( $personResults[0] );
    
    #--- Collect all values of this person, add a DNF at the end.
    $values = array();
    foreach( $personResults as $personResult ){
      foreach( range( 1, 5 ) as $i ){
        $v = $personResult["value$i"];
        if( $v > 0  ||  $v == -1 )
          $values[] = $v;
      }
    }
    $values[] = -1;
  
    #--- Find longest streak.
    $streak = array();
    $bestStreak = array();
    foreach( $values as $v ){
      if( $v > 0 )
        $streak[] = $v;
      else {
        if( count( $streak ) >= count( $bestStreak ))
          $bestStreak = $streak;
        $streak = array();
      }
    }

    if( ! $bestStreak )
      continue;
    
    $best = min( $bestStreak );
    $worst = max( $bestStreak );
    $formatted = array();
    foreach( $bestStreak as $v ){
      $f = formatValue( $v, 'time' );
      if( $v == $best ) $f = "<span style='color:#0E0;font-weight:bold'>$f</span>";
      if( $v == $worst ) $f = "<span style='color:#E33;font-weight:bold'>$f</span>";
      $formatted[] = $f;
    }
    $persons[] = array (
      "$personId-$personName",
      count( $bestStreak ),
      implode( ' &nbsp; ', $formatted ),
      $best
    );
  }

  usort( $persons, 'compareBlindfoldStreaks' );
  $persons = array_slice( $persons, 0, 10 );
  
  $lists[] = array(
    "Blindfold 3x3x3 longest success streak",
    "",
    "[P] Person [N] Length [t] Times",
    $persons
  );
}

function compareBlindfoldStreaks ( $a, $b ) {
  if( $a[1] > $b[1] ) return -1;
  if( $a[1] < $b[1] ) return 1;
  if( $a[3] < $b[3] ) return -1;
  if( $a[3] > $b[3] ) return 1;
  return 0;
}

?>
