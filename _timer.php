<?

function microtime_float () {
 list( $usec, $sec ) = explode( " ", microtime() );
 return (float)$usec + (float)$sec;
}

function startTimer () {
  global $timerStartTimes;
  $timerStartTimes[] = microtime_float();
}

function stopTimer ( $message ) {
  global $timerStartTimes;
  $elapsed = microtime_float() - array_pop( $timerStartTimes );
  if( debug() )
    printf( "<b>%.4f seconds</b> for for '$message'<br />", $elapsed );
}

?>
