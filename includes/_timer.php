<?php

function microtime_float () {
  list( $usec, $sec ) = explode( " ", microtime() );
  return (float)$usec + (float)$sec;
}

function startTimer () {
  global $timerStartTimes;
  $timerStartTimes[] = microtime_float();
}

function stopTimer ( $message, $forceShow=false ) {
  global $timerStartTimes;
  $elapsed = microtime_float() - array_pop( $timerStartTimes );
  if( wcaDebug() || $forceShow )
    printf( "<b>%.4f seconds</b> for '$message'<br />", $elapsed );
  return $elapsed;
}
