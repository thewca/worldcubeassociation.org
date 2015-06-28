<?php

add_333_consecutive_sub20();

function add_333_consecutive_sub20 () {
  global $lists, $WHERE;
  
  #--- Get ...
  $results = dbQuery("
    SELECT personName, personId, value1, value2, value3, value4, value5
    FROM Results result, Competitions competition
    $WHERE 1
      AND eventId = '333'
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
      if( $v > 0  &&  $v < 2000 )
        $streak[] = $v;
      else {
        if( count( $streak ) >= count( $bestStreak ))
          $bestStreak = $streak;
        $ongoingStreak = $streak;
        $streak = array();
      }
    }

    #--- Build the data for the person.
    if( $bestStreak )
      $persons[] = analyzeSub20Streak( $personId, $personName, $bestStreak );
    if( $ongoingStreak )
      $ongoing[] = analyzeSub20Streak( $personId, $personName, $ongoingStreak );
  }

  #--- Sort and cut.
  usort( $persons, 'compareSub20Streaks' );
  usort( $ongoing, 'compareSub20Streaks' );
  $persons = array_slice( $persons, 0, 10 );
  $ongoing = array_slice( $ongoing, 0, 10 );
  $persons = array_map( 'formatSub20Streak', $persons );
  $ongoing = array_map( 'formatSub20Streak', $ongoing );
  
  #--- Specify the list.
  $lists[] = array(
    "sub20_streak_3x3",
    "3x3x3 longest sub20 streak",
    "all-time / ongoing",
    "[P] Person [N] Length [N] Best [N] Average [N] Worst [T] | [P] Person [N] Length [N] Best [N] Average [N] Worst [T]",
    my_merge( $persons, $ongoing )
  );
}

function analyzeSub20Streak ( $personId, $personName, $streak ) {
  return array (
    'idAndName' => "$personId-$personName",
    'length'    => count( $streak ), 
    'best'      => min( $streak ),
    'worst'      => max( $streak ),
    'average'   => array_sum( $streak ) / count( $streak )
  );
}

function compareSub20Streaks ( $a, $b ) {
  if( $a['length'] > $b['length'] ) return -1;
  if( $a['length'] < $b['length'] ) return 1;
  if( $a['worst'] < $b['worst'] ) return -1;
  if( $a['worst'] > $b['worst'] ) return 1;
  return 0;
}

function formatSub20Streak ( $data ) {
  extract( $data );
  $best = formatValue( $best, 'time' );
  $worst = formatValue( $worst, 'time' );
  $average = formatValue( $average, 'time' );
  return array (
    $idAndName,
    $length,
    "<span style='color:#0E0;font-weight:bold'>$best</span>",
    $average,
    "<span style='color:#E33;font-weight:bold'>$worst</span>"
  );
}

?>
