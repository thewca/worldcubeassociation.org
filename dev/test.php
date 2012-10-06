<?php

#----------------------------------------------------------------------
# DESCRIPTION:
#
#   This tool currently downloads 514 pages of our system into its
#   'test_files' folder. It can be used to test the effects of code
#   changes (mainly to detect unintentional side effects) and I have
#   already found some mistakes with it (and then fixed them).
#
#   It isn't finished yet, but I put it in the repository already so
#   you guys can maybe try it already or give feedback.
#
# TODO:
#   - Test invalid parameters (e.g., 'Europe' instead of '_Europe')
#   - Look for identical files (can point out misspelled and thus unrecognized parameters)
#   - Compare the number of actual files produced with the number of expected files
#   - Don't hardcode the competition password. Specify the competitionId and read them from the database.
#   - Store in different groups in different subfolders?
#   - Enforce SSL (or better, that it isn't used on the live site)
#   - Look for empty files
#   - You could use this to search for un-urlencoded links
#   - Also test with false/empty/missing passwords (and maybe a second competition)
#----------------------------------------------------------------------

#--- Preparation
require( '../includes/_timer.php' );
error_reporting( E_ALL ); ini_set( "display_errors", 1 );
ini_set( 'memory_limit', '-1' );
set_time_limit( 0 );
if ( ! file_exists( 'test_files' ) )
  mkdir( 'test_files' );
if ( ! file_exists( 'test_files/error' ) )
  mkdir( 'test_files/error' );
$getstoreCalls = $filesExisted = $errorFilesExisted = $numberErrors = 0;

#--- Start the timer
function wcaDebug() { return true; }
startTimer();

#--- Store each main page
getstore( '', 'index.html' );
getstore( 'events.php', 'events.html' );
getstore( 'regions.php', 'regions.html' );
getstore( 'competitions.php', 'competitions.html' );
getstore( 'persons.php', 'persons.html' );
getstore( 'media.php', 'media.html' );
getstore( 'statistics.php?update8392=1', 'statistics.html' );
getstore( 'misc.php', 'misc.html' );

#--- Store some event rankings
foreach( array( '', '555', '333fm' ) as $eventId )
  foreach( array( '', '_Europe', 'USA' ) as $regionId )
    foreach( array( '', 'until%2B2011', 'only%2B2010' ) as $years )
      foreach( array( '', 'All%2BPersons', 'By%2BRegion', '1000%2BResults' ) as $show )
        foreach( array( 'single=Single', 'average=Average' ) as $button )
          getstore( "events.php?eventId=$eventId&regionId=$regionId&years=$years&show=$show&$button",
                    "events_{$eventId}_{$regionId}_{$years}_{$show}_{$button}.html" );

#--- Store some regional records
foreach( array( '', '555', '333fm' ) as $eventId )
  foreach( array( '', '_Europe', 'USA' ) as $regionId )
    foreach( array( '', 'until%2B2011' ) as $years )
      foreach( array( 'mixed=Mixed', 'slim=Slim', 'separate=Separate', 'history=History' ) as $button )
        getstore( "regions.php?eventId=$eventId&regionId=$regionId&years=$years&$button",
                  "regions_{$eventId}_{$regionId}_{$years}_{$button}.html" );

#--- Store some competiton pages
foreach( array( '', '555', '333fm' ) as $eventId )
  foreach( array( '', '_Europe', 'USA' ) as $regionId )
    foreach( array( '', 'current', 'only%2B2010' ) as $years )
      foreach( array( '', 'f' ) as $pattern )
        foreach( array( 'list=List', 'map=Map' ) as $button )
          getstore( "competitions.php?eventId=$eventId&regionId=$regionId&years=$years&pattern=$pattern&$button",
                    "competitions_{$eventId}_{$regionId}_{$years}_{$pattern}_{$button}.html" );
foreach( explode( ' ', 'WC2011 AsianChampionship2010 USNationals2012 WC2013' ) as $competitionId )
  foreach( array( '', 'winners=Winners', 'top3=Top+3', 'allResults=All+Results', 'byPerson=By+Person' ) as $button )
    getstore( "competition.php?competitionId=$competitionId&$button",
              "competition_{$competitionId}_{$button}.html" );

#--- Store some person pages
foreach( array( '', '555', '333fm' ) as $eventId )
  foreach( array( '', '_Europe', 'USA' ) as $regionId )
    foreach( array( '', 'and', 'c+u+b+e' ) as $pattern )
      getstore( "persons.php?eventId=$eventId&regionId=$regionId&pattern=$pattern&search=Search",
                "persons_{$eventId}_{$regionId}_{$pattern}.html" );
foreach( explode( ' ', '2003POCH01 2009ZEMD01 2006GALE01 2003BURT01 2008COUR01 2003DENN01 2003BRUC01 2005AKKE01 2003VAND01 2004CHAN04 2008AURO01' ) as $personId ){
  getstore( "p.php?i=$personId", "person_{$personId}.html" );
  getstore( "person_map.php?i=$personId", "person_map_{$personId}.html" );
}

#--- Store some media pages
foreach( array( '', '_Europe', 'USA' ) as $regionId )
  foreach( array( '', 'until%2B2011', 'only%2B2010' ) as $years )
    foreach( array( '', 'submission', 'date' ) as $order )
      getstore( "media.php?regionId=$regionId&years=$years&order=$order&filter=Filter",
                "media_{$regionId}_{$years}_{$order}.html" );

#--- Store some admin pages
getstore( "admin/",                                  "admin.html" );
getstore( "admin/check_results.php",                 "admin_check_results.html" );
getstore( "admin/persons_check_finished.php",        "admin_persons_check_finished.html" );
getstore( "admin/check_rounds.php",                  "admin_check_rounds.html" );
getstore( "admin/check_regional_record_markers.php", "admin_check_regional_record_markers.html" );
getstore( "admin/compute_auxiliary_data.php",        "admin_compute_auxiliary_data.html" );
getstore( "admin/export_public.php",                 "admin_export_public.html" );
getstore( "admin/show_competition_details.php",      "admin_show_competition_details.html" );
getstore( "admin/show_competition_infos.php",        "admin_show_competition_infos.html" );
getstore( "admin/validate_media.php",                "admin_validate_media.html" );
getstore( "admin/change_person.php",                 "admin_change_person.html" );
getstore( "admin/add_local_names.php",               "admin_add_local_names.html" );
getstore( "admin/persons_picture.php",               "admin_persons_picture.html" );
getstore( "admin/competitions_manage.php",           "admin_competitions_manage.html" );

#--- Store some orga pages
/*
$rand = rand();
$passOrga = 'todo';
$passAdmin = 'todo';
getstore( "competition_edit.php?competitionId=France2012&password=$passOrga&rand=$rand", "orga_competition_edit_orga.html" );
getstore( "competition_edit.php?competitionId=France2012&password=$passAdmin&rand=$rand", "orga_competition_edit_admin.html" );
getstore( "registration_information.php?competitionId=France2012&password=",          "orga_registration_information.html" );
getstore( "registration_sheet.php?competitionId=France2012&password=",                "orga_registration_sheet.csv" );
getstore( "registration_set_spreadsheet.php?competitionId=France2012&password=",      "orga_registration_set_spreadsheet.xlsx" );
getstore( "competition_registration.php?competitionId=France2012",                    "orga_competition_registration.html" );
getstore( "competition_registration.php?competitionId=France2012&list=1",             "orga_competition_registration_list.html" );
getstore( "map_coords.php?competitionId=France2012&password=$passAdmin",                  "orga_map_coords.html" );
*/

#--- Show statistics
stopTimer('the whole thing');
echo "<p>$getstoreCalls calls to getstore(...)</p>";
echo "<p>$numberErrors files with errors</p>";
echo "<p>$filesExisted files already existed without errors</p>";
echo "<p>$errorFilesExisted files already existed with errors</p>";

#----------------------------------------------------------------------
function getstore ( $urlFromBase, $filename ) {
#----------------------------------------------------------------------
  global $getstoreCalls, $filesExisted, $errorFilesExisted, $numberErrors;
  $getstoreCalls++;

  #--- Build filename and URL
  $errorFilename = "test_files/error/$filename";
  $filename = "test_files/$filename";
  if ( file_exists( $filename ) && filesize( $filename ) > 0 ) {
    $filesExisted++;
    return;
  }
  if ( file_exists( $errorFilename ) && filesize( $errorFilename ) > 0 ) {
    $errorFilesExisted++;
    return;
  }
  $url = (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on" ? 'https://' : 'http://')
       . $_SERVER["SERVER_NAME"] . ":" . $_SERVER["SERVER_PORT"]
       . str_replace( 'dev/test.php', '', $_SERVER["REQUEST_URI"] )
       . $urlFromBase
       . (strpos($urlFromBase, '?') ? '&nocache' : '?nocache');
  echo "<p>" . htmlentities( "downloading [$url] to [$filename] " ) . "</p>";

  #--- Download the from the URL
  $html = file_get_contents( $url );

  #--- Normalize
  $html = str_replace( 'wca-website', 'wcar_clean_svn', $html );
  $html = preg_replace( '/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \\d\\d? (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 20\\d\\d \\d\\d?:\\d\\d:\\d\\d \\+0200/', 'SOME DATETIME', $html );
  $html = preg_replace( '/new42=\\d+/', 'new42=12345', $html );
  $html = preg_replace( "/name='filter\\d+'/", "name='filter12345'", $html );
  $html = preg_replace( "/&amp;rand=\\d+'/", "&amp;rand=12345'", $html );
  $html = preg_replace( "/&rand=\\d+'/", "&rand=12345'", $html );
  $html = preg_replace( '/"rand" value="\\d+"/', '"rand" value="12345"', $html );
  $html = preg_replace( '/Updating took \\d+.\\d\\d seconds/', 'Updating took 12.34 seconds', $html );

  #--- Point out errors and save in the 'error' subfolder
  if ( strstr( $html, 'xdebug-error' ) ){
    echo "<p style='background-color:red'>ERROR !!!</p>";
    $filename = $errorFilename;
    $numberErrors++;
  }
  
  #--- Store
  file_put_contents( $filename, $html );

  /*
  $ch = curl_init(); // Initialize Curl
  $url="http://devlup.com"; //URL of the webpage you want to download
  curl_setopt($ch, CURLOPT_URL, $url); // Set CURL options
  curl_setopt($ch,CURLOPT_RETURNTRANSFER,1); //Return the handle if the curl session is set
  $output = curl_exec($ch); // execute the curl
  curl_close($ch); // close the curl
  */
}

?>