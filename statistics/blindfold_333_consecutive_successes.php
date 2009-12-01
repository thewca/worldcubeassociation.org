<?

add_blindfold_333_consecutive_successes();

function add_blindfold_333_consecutive_successes () {
  global $lists, $WHERE;
  
  #--- Get ...
  $results = dbQuery("
    SELECT personId, value1, value2, value3, value4, value5
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

    #--- This person doesn't have any streak? Next person, please.
    if( ! $bestStreak )
      continue;

    #--- Determine properties of the streak.
    $length  = count( $bestStreak );
    $best    = min( $bestStreak );
    $worst   = max( $bestStreak );
    $average = array_sum( $bestStreak ) / $length;

    #--- Format and memorize this person with its streak
    $persons[] = array (
      $personId,
      $length,
      '',
      '<span style="color:#0C0">' . formatValue($best) . '</span>',
      $average,
      '<span style="color:#E00">' . formatValue($worst) . '</span>'
    );
  }

  usort( $persons, 'compareBlindfoldStreaks' );
  $persons = array_slice( $persons, 0, 10 );
  
  $lists[] = array(
    "Blindfold 3x3x3 longest success streak",
    "",
    "[P] Person [N] Length [t] &nbsp; [r] Best [r] Avg [r] Worst",
    $persons
  );
}

function compareBlindfoldStreaks ( $a, $b ) {
  #--- Compare streak lengths
  if( $a[1] > $b[1] ) return -1;
  if( $a[1] < $b[1] ) return 1;
  #--- Compare best times
  if( $a[4] < $b[4] ) return -1;
  if( $a[4] > $b[4] ) return 1;
  #--- Ok consider them equal
  return 0;
}

?>
