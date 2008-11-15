<?

require '_timer.php';
require '_parameters.php';
require '_database.php';
require '_choices.php';
require '_tables.php';
require '_links.php';
require '_values.php';

#----------------------------------------------------------------------

function eventName ( $eventId ) {
  $event = getEvent( $eventId );
  return $event['name'];
}

function eventCellName ( $eventId ) {
  $event = getEvent( $eventId );
  return $event['cellName'];
}

function getEvent ( $eventId ) {
  foreach( getAllEvents() as $event )
    if( $event['id'] == $eventId )
      return $event;
}

function getCompetition ( $id ) {
  foreach( getAllCompetitions() as $competition )
    if( $competition['id'] == $id )
      return $competition;
}

function valueFormat ( $eventId ) {
  $event = getEvent( $eventId );
  return $event['format'];
}

#----------------------------------------------------------------------
function competitionDate ( $competition ) {
#----------------------------------------------------------------------
  extract( $competition );

  $months = split( " ", ". Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec" );
  $date = $month ? $months[$month] : '&nbsp;';
  if( $day )
    $date .= " $day";
  if( $endMonth != $month )
    $date .= " - " . $months[$endMonth] . " $endDay";
  elseif( $endDay != $day )
    $date .= "-$endDay";
  return $date;
}

#----------------------------------------------------------------------

function spaced ( $parts ) {
  return implode( str_repeat( '&nbsp;', 10 ), array_filter( $parts ));
}

function htmlEscape ( $string ) {
  return htmlEntities( $string, ENT_QUOTES );
}

function chosenRegionName () {
  global $chosenRegionId;
  return preg_replace( '/^_/', '', $chosenRegionId );
}

function chosenEventName () {
  global $chosenEventId;
  return $chosenEventId ? eventName( $chosenEventId ) : '';
}

function randomDebug () {
  return debug() ? rand( 1, 30000 ) : 1;
}

function assertFoo ( $check, $message ) {
  if( ! $check )
    showErrorMessage( $message );
}

function showErrorMessage( $message ) {
  echo "<div class='errorMessage'>Error: $message</div>";
}

#----------------------------------------------------------------------

function eventCondition () {
  global $chosenEventId;
  return $chosenEventId ? " AND eventId = '$chosenEventId' " : "";
}

function competitionCondition () {
  global $chosenCompetitionId;
  return $chosenCompetitionId ? " AND competitionId = '$chosenCompetitionId' " : "";
}

function yearCondition () {
  global $chosenYears;

  if( $chosenYears == 'current' )
    return "AND (10000*year+100*month+day)>" . 
	 date( 'Ymd', mktime(0, 0, 0, date( 'm' ) - 3, date( 'd' ), date( 'Y' )) );

  if( preg_match( '/^until (\d+)$/', $chosenYears, $match ))
    return " AND year <= $match[1] ";

  if( preg_match( '/^only (\d+)$/', $chosenYears, $match ))
    return " AND year = $match[1] ";

  return '';
}

function regionCondition ( $countrySource ) {
  global $chosenRegionId;
  
  if( preg_match( '/^(world)?$/i', $chosenRegionId ))
    return '';

  if( preg_match( '/^_/', $chosenRegionId ))
    return " AND continentId = '$chosenRegionId'";

  if( $countrySource )
    $countrySource .= '.';

  return " AND ${countrySource}countryId = '$chosenRegionId'";
}

#----------------------------------------------------------------------
function noticeBox ( $isSuccess, $message ) {
#----------------------------------------------------------------------

  $color = $isSuccess ? '33CC33' : 'FF0000';
  $colorInside = $isSuccess ? 'DDFFDD' : 'FFE8E8';
  echo "<center><table border='0' cellpadding='3' width='90%'><tr><td bgcolor='#$color'>";
  echo "<table border='0' cellpadding='5' width='100%'><tr><td bgcolor='#$colorInside'>";
  echo "<p><b style='color:#$color'>$message</b></p>";
  echo "</td></tr></table>";
  echo "</td></tr></table></center>";
}

#----------------------------------------------------------------------
function noticeBox2 ( $isSuccess, $yesMessage, $noMessage ) {
#----------------------------------------------------------------------

  noticeBox( $isSuccess, $isSuccess ? $yesMessage : $noMessage );
}

#----------------------------------------------------------------------
function pathToRoot () {
#----------------------------------------------------------------------
  global $pathToRoot;
  
  if( ! isset( $pathToRoot )){
    $pathToRoot = "";
    while( ! file_exists( "${pathToRoot}_root.txt" ))
      $pathToRoot .= "../";
  }
  
  return $pathToRoot;
}

?>
