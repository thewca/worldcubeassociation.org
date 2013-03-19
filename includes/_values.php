<?php

#----------------------------------------------------------------------
function formatValue( $value, $format='time' ) {
#----------------------------------------------------------------------

  if( !is_numeric($value) )  # TOD?: remove later
    $format = 'raw';

  if( $format == 'raw' )
    return $value;

  $v = intval(0+$value);

  #--- Special cases.
  if( $v  < -2 ) return 'ERROR';
  if( $v == -2 ) return 'DNS';
  if( $v == -1 ) return 'DNF';
  if( $v ==  0 ) return '';

  #--- Just a number?
  if( $format == 'number' )
    return $v;

  #--- Multi.
  if( $format == 'multi' ){

    #--- Extract value parts.
    $old = intval( $value / 1000000000);

    if ( $old ) {


      $time      = $value % 100000; $value = intval( $value / 100000 );
      $attempted =      $value % 100; $value = intval( $value / 100 );
      $solved    = 99 - $value % 100; $value = intval( $value / 100 );

    }

    else {

      $missed     = $value % 100; $value = intval( $value / 100 );
      $time       = $value % 100000; $value = intval( $value / 100000 );
      $difference = 99 - $value % 100;
      $solved     = $difference + $missed;
      $attempted  = $solved + $missed;

    }

    #--- Build time string.
    if( $time == 99999 ){
      $result = '?:??:??';
    } else {
      $result = "";
      while( $time >= 60 ){
        $result = sprintf( ":%02d$result", $time % 60 );
        $time = intval( $time / 60 );
      }
      $result = "$time$result";
    }

    #--- Alternative (throw out seconds).
    #$time = intval( $time / 60 );
    #$result = $time ? sprintf( "%d:%02d", intval( $time/60 ), $time%60 ) : '?:??';

    #--- Combine.
    if ( $old )
      return "<span style='color:#999'>$solved/$attempted</span> <span style='color:#999'>$result</span>";
    else      
      return "$solved/$attempted <span style='color:#999'>$result</span>";
  }

  #--- Time...
  if ( $v <   6000 ) return sprintf(           "%d.%02d",                                              ($v-$v%100)/100,    $v%100 );
  if ( $v < 360000 ) return sprintf(      "%d:%02d.%02d",                        ($v-$v%6000)/6000,    ($v-$v%100)/100%60, $v%100 );
  return                    sprintf( "%d:%02d:%02d.%02d", ($v-$v%360000)/360000, ($v-$v%6000)/6000%60, ($v-$v%100)/100%60, $v%100 );
}

#----------------------------------------------------------------------
function formatAverageSources ( $indeedShow, $sources, $format ) {
#----------------------------------------------------------------------
  if( ! $indeedShow )
    return '&nbsp;';
  extract( $sources );
  $sources = array_filter( array( $value1, $value2, $value3, $value4, $value5 ));
  return implode( ' &nbsp; ', array_map( create_function( '$v', "return formatValue( \$v, '$format' );" ), $sources ));
}

#----------------------------------------------------------------------
function isSuccessValue ( $value, $format ) {
#----------------------------------------------------------------------

  return ($format != 'multi') ? ($value > 0) : ($value < 1000000000);
}
