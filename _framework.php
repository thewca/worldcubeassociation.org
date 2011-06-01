<?

require '_timer.php';
require '_parameters.php';
require '_database.php';
require '_choices.php';
require '_tables.php';
require '_links.php';
require '_values.php';
require '_cache.php';

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
  foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event )
    if( $event['id'] == $eventId )
      return $event;
}

function isOfficialEvent ( $eventId ) {
  return in_array( $eventId, getAllEventIds() );
}

function readEventSpecs ( $eventSpecs ) {
  foreach( array_merge( getAllEventIds(), getAllUnofficialEventIds() ) as $eventId )
    if( preg_match( "/(^| )$eventId\b(=(\d*)\/(\d*)\/(\w*)\/(\d*)\/(\d*))?/", $eventSpecs, $matches )) {
      $eventSpecsTree["$eventId"]['personLimit']      = $matches[3];
      $eventSpecsTree["$eventId"]['timeLimit']        = $matches[4];
      $eventSpecsTree["$eventId"]['timeFormat']       = $matches[5];
      $eventSpecsTree["$eventId"]['qualify']          = $matches[6];
      $eventSpecsTree["$eventId"]['qualifyTimeLimit'] = $matches[7];
    }
  return $eventSpecsTree;
}

function getEventSpecsEventIds ( $eventSpecs ) {
 return( array_keys( readEventSpecs( $eventSpecs )));
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
  return htmlEntities( $string, ENT_QUOTES, "UTF-8" );
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

  #--- current = 90 days into the past + all future
  if( $chosenYears == 'current' )
    return "AND (10000*year+100*month+day)>" . wcaDate( 'Ymd', time() - 90 * 24 * 60 * 60 );

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

  noticeBox3( $isSuccess ? 1 : -1, $message );
}

#----------------------------------------------------------------------
function noticeBox2 ( $isSuccess, $yesMessage, $noMessage ) {
#----------------------------------------------------------------------

  noticeBox( $isSuccess, $isSuccess ? $yesMessage : $noMessage );
}

#----------------------------------------------------------------------
function noticeBox3 ( $color, $message ) {
#----------------------------------------------------------------------

  #--- Color: -1=red, 0=yellow, 1=green
  $colorBorder = array( 'FF0000', 'DDBB00', '33CC33' ); $colorBorder = $colorBorder[ $color+1 ];
  $colorInside = array( 'FFE8E8', 'FFFF88', 'DDFFDD' ); $colorInside = $colorInside[ $color+1 ];
  
  #--- Show the notice
  echo "<center><table border='0' cellpadding='3' width='90%'><tr><td bgcolor='#$colorBorder'>";
  echo "<table border='0' cellpadding='5' width='100%'><tr><td bgcolor='#$colorInside'>";
  echo "<p><b style='color:#$colorBorder'>$message</b></p>";
  echo "</td></tr></table>";
  echo "</td></tr></table></center>";
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

#----------------------------------------------------------------------
function wcaDate ( $format='r', $timestamp=false ) {
#----------------------------------------------------------------------

  #--- Set timezone (otherwise date() might complain), then return the date
  date_default_timezone_set( 'Europe/Berlin' );
  return date( $format, $timestamp ? $timestamp : time() );
}

#----------------------------------------------------------------------
function extractRomanName ( $name ) {
#----------------------------------------------------------------------
  if( preg_match( '/(.*)\((.*)\)$/', $name, $matches ))
    return( rtrim( $matches[1] ));
  else
    return( $name );
}

#----------------------------------------------------------------------
function extractLocalName ( $name ) {
#----------------------------------------------------------------------
  if( preg_match( '/(.*)\((.*)\)$/', $name, $matches ))
    return( $matches[2] );
  else
    return( '' );
}

?>
