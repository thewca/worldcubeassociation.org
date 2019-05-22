<?php

#----------------------------------------------------------------------
function checkResult ( $result, &$countryIdSet, &$competitionIdSet, &$eventIdSet, &$formatIdSet, &$roundTypeIdSet ) {  # pass-by-reference just for speed
#----------------------------------------------------------------------

  #--- 1) Check the ids (except persons cause they're a bigger beast checked elsewhere)
  if( ! isset( $countryIdSet[$result['countryId']] ))         return "bad countryId " . $result['countryId'];
  if( ! isset( $competitionIdSet[$result['competitionId']] )) return "bad competitionId " . $result['competitionId'];
  if( ! isset( $eventIdSet[$result['eventId']] ))             return "bad eventId " . $result['eventId'];
  if( ! isset( $formatIdSet[$result['formatId']] ))           return "bad formatId " . $result['formatId'];
  if( ! isset( $roundTypeIdSet[$result['roundTypeId']] ))             return "bad roundTypeId " . $result['roundTypeId'];

  #--- 2) Let dns, dnf, zer, suc be the number of values of each kind.
  $dns = $dnf = $zer = $suc = 0;
  foreach( range( 1, 5 ) as $i ){
    $value = $result["value$i"];
    $dns += $value == -2;
    $dnf += $value == -1;
    $zer += $value == 0;
    $suc += $value > 0;
  }

  #--- 3) Check that no zero-value is followed by a non-zero value.
  foreach( range( 1, 4 ) as $i )
    if( $result["value$i"] == 0  &&  $result["value".($i+1)] != 0 )
      return "Zero must not be followed by non-zero.";

  #--- 4) Check zer<5 (there must be at least one non-zero value)
  if( $zer == 5 )
    return "There must be at least one non-zero value";

  #--- 5) Check dns+dnf+zer+suc=5 (nothing besides these is allowed)
  if( $dns + $dnf + $zer + $suc != 5 )
    return "Invalid value";

  #--- 6) Sort the successful values into v_1 .. v_suc
  $v = array();
  foreach( range( 1, 5 ) as $i ){
    $value = $result["value$i"];
    if( $value > 0 )
      $v[] = $value;
  }
  sort( $v );
  array_unshift( $v, 0 );

  #--- 7) compute best
  $best = ($suc > 0) ? $v[1] : (($dnf > 0) ? -1 : -2);

  #--- 8) compute average
  $average = 0;
  $format = $result['formatId'];
  $event = $result['eventId'];
  $bo3_as_mo3 = ($format=='3' && ($event=='333bf' || $event=='444bf' || $event=='555bf' || $event=='333fm' || $event=='333ft'));
  $scaler = ($event=='333fm') ? 100 : 1;
  if( $format == 'm' || $bo3_as_mo3)
    $average = ($zer > 2) ? 0 : (($suc < 3) ? -1 : round(($v[1] + $v[2] + $v[3]) * $scaler / 3));
  if( $format == 'a' )
    $average = ($zer > 0) ? 0 : (($suc < 4) ? -1 : round(($v[2] + $v[3] + $v[4]) / 3));
  if( $average > 60000 )
    $average = ($average + 50 - (($average + 50) % 100));

  #--- 9) compare the computed best and average with the stored ones
  if( $result['best']    != $best    ) return    "'best' should be $best";
  if( $result['average'] != $average ) return "'average' should be $average";

  #--- 10) check number of zero-values for non-combined rounds
  $round = $result['roundTypeId'];
  if( $round != 'c'  &&  $round != 'd'  &&  $round != 'e'  &&  $round != 'g' && $round != 'h' ){
    if( $format == '1'  &&  $zer != 4 ) return "should have one non-zero value";
    if( $format == '2'  &&  $zer != 3 ) return "should have two non-zero values";
    if( $format == '3'  &&  $zer != 2 ) return "should have three non-zero values";
    if( $format == 'm'  &&  $zer != 2 ) return "should have three non-zero values";
    if( $format == 'a'  &&  $zer != 0 ) return "shouldn't have zero-values";
  }
  #--- 11) same for combined rounds
  else {
    if( $format == '2'  &&  $zer < 3 ) return "should have at most two non-zero values";
    if( $format == '3'  &&  $zer < 2 ) return "should have at most three non-zero values";
    if( $format == 'm'  &&  $zer < 2 ) return "should have at most three non-zero values";
  }

  #--- 12) check times over 10 minutes
  if( valueFormat( $result['eventId'] ) == 'time' )
    foreach( range( 1, 5 ) as $i ){
      $value = $result["value$i"];
      if(( $value > 60000 ) && ( $value % 100 ))
        return "$value should be rounded";
  }

  #--- 13) check correctness of multi results according to H1b and H1c
  if( $result['eventId'] == '333mbf' ){
    foreach( range( 1, 5 ) as $i ){
      $value = $result["value$i"];
      if( $value < 1 )
        continue;
      $missed     = $value % 100; $value = intval( $value / 100 );
      $time       = $value % 100000; $value = intval( $value / 100000 );
      $difference = 99 - $value % 100;
      $solved     = $difference + $missed;
      $attempted  = $solved + $missed;

      if( $time > 3600 )
        return  formatValue( $result["value$i"], 'multi') . " should be below one hour";
      if( $time > ( 600 * $attempted ))
        return  formatValue( $result["value$i"], 'multi') . " should be below 10 minutes times the number of cubes";
    }
  }

  #--- No error
  return false;
}
