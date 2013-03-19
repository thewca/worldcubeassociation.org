<?php
/*
 * @file
 * Including this file should load all result system functionality.
 * All includes (if necessary) should be done in this file, not elsewhere.
 */
session_start();

// classes are autoloaded.
require_once("WCAClasses/autoload.php");

// Let's set up system configuration data first.
global $config;
$config = new WCAClasses\ConfigurationData();
// perform some basic installation checks here
$installation_errors = $config->validateInstall();

// Create a global database connection object.
global $wcadb_conn;
$wcadb_conn = new WCAClasses\WCADBConn($config->get("database"));


// current results system functionality
require '_timer.php';
require '_parameters.php';
require '_database.php';
require '_choices.php';
require '_tables.php';
require '_links.php';
require '_values.php';
require '_cache.php';
require '_map.php';
require '_navigation.php';


#----------------------------------------------------------------------

/*
 * Shorthand for html entities.
 * Need to move this to somewhere more appropriate eventually.
 */
function o($value, $flags = ENT_QUOTES)
{
  return htmlentities($value, $flags);
}


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

  // Failed to get from cache file
  $event = dbQuery( "SELECT * FROM Events WHERE id='$eventId'" );
  if( count( $event ) == 1 )
    return $event[0];
}

function readEventSpecs ( $eventSpecs ) {
  $eventSpecsTree = array();
  foreach( getAllEventIdsIncludingObsolete() as $eventId )
    if( preg_match( "/(^| )$eventId\b(=(\d*)\/(\d*)\/(\w*)\/(\d*)\/(\d*))?/", $eventSpecs, $matches )) {
      $eventSpecsTree["$eventId"]['personLimit']      = isset( $matches[3] ) ? $matches[3] : "";
      $eventSpecsTree["$eventId"]['timeLimit']        = isset( $matches[4] ) ? $matches[4] : "";
      $eventSpecsTree["$eventId"]['timeFormat']       = isset( $matches[5] ) ? $matches[5] : "";
      $eventSpecsTree["$eventId"]['qualify']          = isset( $matches[6] ) ? $matches[6] : "";
      $eventSpecsTree["$eventId"]['qualifyTimeLimit'] = isset( $matches[7] ) ? $matches[7] : "";
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

function roundCellName ( $roundId ) {
  $round = getRound( $roundId );
  return $round['cellName'];
}

function getRound ( $roundId ) {
  foreach( getAllRounds() as $round )
    if( $round['id'] == $roundId )
      return $round;
}

function getCountry ( $countryId ) {
  foreach( getAllUsedCountries() as $country )
    if( $country['id'] == $countryId )
      return $country;
}

function valueFormat ( $eventId ) {
  $event = getEvent( $eventId );
  return $event['format'];
}

#----------------------------------------------------------------------
function competitionDate ( $competition ) {
#----------------------------------------------------------------------
  extract( $competition );

  $months = explode( " ", ". Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec" );
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
  return htmlentities( $string, ENT_QUOTES, "UTF-8" );
}

function chosenRegionName ( $visibleWorld = false ) {
  global $chosenRegionId;
  if ( !$chosenRegionId && $visibleWorld ) return 'World';
  return preg_replace( '/^_/', '', $chosenRegionId );
}

function chosenEventName () {
  global $chosenEventId;
  return $chosenEventId ? eventName( $chosenEventId ) : '';
}

function randomDebug () {
  return wcaDebug() ? rand( 1, 30000 ) : 1;
}

function assertFoo ( $check, $message ) {
  if( ! $check )
    showErrorMessage( $message );
}

function showErrorMessage( $message ) {
  echo "<div class='errorMessage'>Error: $message</div>";
}

function pretty ( $object ) {
  echo "<pre>";
  print_r( $object );
  echo "</pre>";
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
  $colorBorder = array( 'failure', 'warning', 'success' ); $colorBorder = $colorBorder[ $color+1 ];

  #--- Show the notice
  echo "<div class='notice $colorBorder'>$message</div>";
}

function showErrors($errors, $message = "Uh-oh!  The following errors were encountered:") {
  if(!empty($errors)) {
    $message = "<p>{$message}</p>";
    $message .= "<ul>";
    foreach($errors as $error) {
        $message .= "<li>{$error}</li>";
    }
    $message .= "</ul>";
    noticeBox(FALSE, $message);
  }
}

#----------------------------------------------------------------------
function pathToRoot () {
#----------------------------------------------------------------------
  global $config;
  return $config->get('pathToRoot');
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

#----------------------------------------------------------------------
function adminHeadline ( $title, $scriptIfExecution=false ) {
#----------------------------------------------------------------------
  echo "<p><span style='background:#f4f4f4; padding:3px; border:1px solid #ddd'><a href='".pathToRoot()."admin/'>Administration</a> &gt;&gt; "
     . (!$scriptIfExecution ? "<b>$title</b>" : "<a href='$scriptIfExecution.php?forceReload=".time()."'>$title</a> &gt;&gt; <b>Execution</b>")
     . " &nbsp;(" . wcaDate() . ")</span></p>\n";
}
