<?php
/*
 * @file
 * Including this file should load all result system functionality.
 * All includes (if necessary) should be done in this file, not elsewhere.
 */
session_start();

// classes are autoloaded.
require_once("WCAClasses/autoload.php");

// Try to include the pear mail package
$UserDir = trim(`echo ~`);
$pear_user_config = $UserDir . "/.pearrc";
set_include_path("." . PATH_SEPARATOR . $UserDir . "/pear/php" . PATH_SEPARATOR . get_include_path());
@ include "Mail.php";

// Let's set up system configuration data first.
global $config;
$config = new WCAClasses\ConfigurationData();
// perform some basic installation checks here
$installation_errors = $config->validateInstall();

// Create a global database connection object.
global $wcadb_conn;
$wcadb_conn = new WCAClasses\WCADBConn($config->get("database"));
// secondary connection for scripts using PDO
require_once '_pdo_db.php';

// misc. display functions
require_once '_ui.php';

// session functionality
require_once '_session.php';

// current results system functionality
require_once '_timer.php';
require_once '_parameters.php';
require_once '_database.php';
require_once '_choices.php';
require_once '_tables.php';
require_once '_links.php';
require_once '_values.php';
require_once '_cache.php';
require_once '_map.php';
require_once '_navigation.php';



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

function pathToRoot () {
  global $config;
  return $config->get('pathToRoot');
}

function wcaDate ( $format='r', $timestamp=false ) {
  #--- Set timezone (otherwise date() might complain), then return the date
  date_default_timezone_set( 'Europe/Berlin' );
  return date( $format, $timestamp ? $timestamp : time() );
}

function genderText ($gender) {
  if ($gender == 'm') return 'Male';
  if ($gender == 'f') return 'Female';
  return '';
}

function getCurrentPictureFile ($personId) {
  # This is a bit tricky. Under the new rails system, images are uploaded to
  # /uploads/user/avatar/WCA_ID/TIMESTAMP.EXT, and the filename is stored in
  # the users table in the avatar column. However, there are lots of people who
  # have uploaded profile images who don't yet have WCA accounts. To deal with
  # those people, we still need to hit the filesystem and check for them. If
  # people want to remove their avatar, they'll have to sign up for an account
  # and remove it through the edit profile page, which will set their avatar
  # column to null.
  $user = dbQuery( "SELECT wca_id, avatar FROM users WHERE wca_id='$personId'" )[ 0 ];
  if($user) {
    if(!$user['avatar']) {
      return false;
    }
    return "/uploads/user/avatar/${personId}/${user['avatar']}";
  }
  # Match only filenames that don't end in a b (to avoid 1234_thumb.png)
  $files = glob("uploads/user/avatar/${personId}/*[!b].*");
  return $files ? "/" . end($files) : FALSE;
}
