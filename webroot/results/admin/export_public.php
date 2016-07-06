<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
analyzeChoices();
adminHeadline( 'Export to public' );
showDescription();
showChoices();

if( $chosenExport ){

  exportPublic( array(
    'Results'      => 'SELECT   competitionId, eventId, roundId, pos,
                                best, average,
                                personName, personId, result.countryId AS personCountryId,
                                formatId, value1, value2, value3, value4, value5,
                                regionalSingleRecord, regionalAverageRecord
                       FROM     Results result, Competitions competition, Events event, Rounds round
                       WHERE    competition.id=competitionId AND event.id=eventId AND round.id=roundId
                       ORDER BY competition.year, competition.month, competition.day, competition.id,
                                event.rank, round.rank, pos, average, best, personName',
    'RanksSingle'  => 'SELECT personId, eventId, best, worldRank, continentRank, countryRank FROM RanksSingle',
    'RanksAverage' => 'SELECT personId, eventId, best, worldRank, continentRank, countryRank FROM RanksAverage',
    'Rounds'       => '*',
    'Events'       => '*',
    'Formats'      => '*',
    'Countries'    => '*',
    'Continents'   => '*',
    'Persons'      => 'SELECT id, subid, name, countryId, gender FROM Persons',
    # To maintain the database export format, we have to build up the
    # wcaDelegate and organiser fields by joining with the users,
    # competition_delegates, and competition_organizers tables.
    'Competitions' => 'SELECT Competitions.id, Competitions.name, Competitions.cityName, Competitions.countryId, Competitions.information, Competitions.year,
                              Competitions.month, Competitions.day, Competitions.endMonth, Competitions.endDay, Competitions.eventSpecs,
                              GROUP_CONCAT(DISTINCT(CONCAT("[{", users_delegates.name, "}{mailto:", users_delegates.email, "}]")) SEPARATOR " ") as wcaDelegate,
                              GROUP_CONCAT(DISTINCT(CONCAT("[{", users_organizers.name, "}{mailto:", users_organizers.email, "}]")) SEPARATOR " ") as organiser,
                              Competitions.venue, Competitions.venueAddress,
                              Competitions.venueDetails, Competitions.external_website, Competitions.cellName, Competitions.latitude, Competitions.longitude
                              FROM Competitions
                              LEFT JOIN competition_delegates ON Competitions.id=competition_delegates.competition_id LEFT JOIN users AS users_delegates ON users_delegates.id=competition_delegates.delegate_id
                              LEFT JOIN competition_organizers ON Competitions.id=competition_organizers.competition_id LEFT JOIN users AS users_organizers ON users_organizers.id=competition_organizers.organizer_id
                              WHERE Competitions.showAtAll=1
                              GROUP BY competition_delegates.competition_id',
    'Scrambles'   => '*',
  ) );
}

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>This creates the <a href='../misc/export.html'>public export</a> of our database.</p><hr />";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenExport;

  // When running as a CGI script, getNormalParam doesn't seem to work.
  // This is a quick and dirty workaround that looks directly at the
  // relevant CGI environment variable.
  //$chosenExport = getNormalParam( 'export' );
  $requestUri = $_SERVER['REQUEST_URI'];
  $chosenExport = strrpos($requestUri, "export=") !== FALSE;
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    choiceButton( true, 'export', ' Export now ' )
  ));
}

#----------------------------------------------------------------------
function exportPublic ( $sources ) {
#----------------------------------------------------------------------

  #--- No time limit
  set_time_limit( 0 );

  #--- We'll work in the /admin/export directory
  chdir( 'export' );

  #------------------------------------------
  # PREPARATION
  #------------------------------------------

  #--- Get old and new serial number
  $oldSerial = file_get_contents( 'serial.txt' );
  $serial = $oldSerial + 1;
  file_put_contents( 'serial.txt', $serial );

  #--- Build the file basename
  $basename         = sprintf( 'WCA_export%03d_%s', $serial,    wcaDate( 'Ymd' ) );
  $oldBasenameStart = sprintf( 'WCA_export%03d_', $oldSerial );

  #------------------------------------------
  # SQL + TSVs
  #------------------------------------------

  #--- Build SQL and TSV files
  echo "<p><b>Build SQL and TSV files</b></p>";

  #--- Start the SQL file
  $sqlFile = "WCA_export.sql";
  file_put_contents( $sqlFile, "--\n-- $basename\n-- Also read the README.txt\n--\n" );

  #--- Walk the tables, create SQL file and TSV files
  foreach ( $sources as $tableName => $tableSource ) {
    startTimer();
    echo "$tableName ";

    #--- Get the query
    $query = ($tableSource != '*') ? $tableSource : "SELECT * FROM $tableName";

    #--- Add the SQL for creating the table
    file_put_contents( $sqlFile, getTableCreationSql( $tableName, $query ), FILE_APPEND );

    #--- Do the query
    $dbResult = mysql_unbuffered_query( $query )
      or die( '<p>Unable to perform database query.<br/>\n(' . mysql_error() . ')</p>\n' );

    #--- Start the TSV file
    $tsvFile = "WCA_export_$tableName.tsv";
    file_put_contents( $tsvFile, getTsvHeader( $dbResult ) );

    #--- Add data rows
    $sqlStart = "INSERT INTO `$tableName` VALUES ";
    $tsv = '';
    $sqlInserts = array();
    while ( $row = mysql_fetch_array( $dbResult, MYSQL_NUM ) ) {
      // Polish the whitespace (especially remove characters that would break the tsv file format)
      $niceValues = preg_replace( '/\s+/', ' ', array_map( 'trim', $row ) );

      // Data to write
      $tsv .= implode( "\t", $niceValues ) . "\n";
      $sqlInserts[] = "('" . implode( "','", array_map( 'addslashes', $niceValues ) ) . "')";

      // Periodically write data so variable size doesn't explode
      if ( strlen($tsv) > 200000 ) {
        $sql = $sqlStart . implode( ",\n", $sqlInserts ) . ";\n";
        file_put_contents( $tsvFile, $tsv, FILE_APPEND );
        file_put_contents( $sqlFile, $sql, FILE_APPEND );
        $tsv = '';
        $sqlInserts = array();
        echo '.';  # shows both Apache and the user that the script is doing stuff and not hanging
      }
    }
    //Check if any sql need to be exported
    if ($sqlInserts !== array()) {
      $sql = $sqlStart . "\n" . implode( ",\n", $sqlInserts ) . ";\n";
      file_put_contents( $tsvFile, $tsv, FILE_APPEND );
      file_put_contents( $sqlFile, $sql, FILE_APPEND );
    }

    #--- Free the query result
    mysql_free_result( $dbResult );

    echo "<br />\n";
    stopTimer( $tableName );
  }

  #------------------------------------------
  # README
  #------------------------------------------

  #--- Build the README file
  echo "<p><b>Build the README file</b></p>";
  instantiateTemplate( 'README.txt', array( 'longDate' => wcaDate( 'F j, Y' ) ) );

  #------------------------------------------
  # ZIPs
  #------------------------------------------

  #--- Build the ZIP files
  echo "<p><b>Build the ZIP files</b></p>";
  $sqlZipFile  = "$basename.sql.zip";
  $tsvZipFile  = "$basename.tsv.zip";
  mySystem( "zip $sqlZipFile README.txt $sqlFile" );
  mySystem( "zip $tsvZipFile README.txt *.tsv" );

  #------------------------------------------
  # HTML
  #------------------------------------------

  #--- Build the HTML file
  echo '<p><b>Build the HTML file</b></p>';
  instantiateTemplate( 'export.html', array(
                       'sqlZipFile'     => $sqlZipFile,
                       'sqlZipFileSize' => sprintf( '%.1f MB', filesize( $sqlZipFile ) / 1000000 ),
                       'tsvZipFile'     => $tsvZipFile,
                       'tsvZipFileSize' => sprintf( '%.1f MB', filesize( $tsvZipFile ) / 1000000 ),
                       'README'         => file_get_contents( 'README.txt' ) ) );

  #------------------------------------------
  # DEPLOY
  #------------------------------------------

  #--- Move new files to public directory
  echo '<p><b>Move new files to public directory</b></p>';
  mySystem( "mv $sqlZipFile $tsvZipFile ../../misc/" );
  mySystem( "mv export.html ../../misc/" );

  #------------------------------------------
  # CLEAN UP
  #------------------------------------------

  #--- Delete temporary and old stuff we don't need anymore
  echo "<p><b>Delete temporary and old stuff we don't need anymore</b></p>";
  mySystem( "rm README.txt $sqlFile *.tsv" );
  mySystem( "rm ../../misc/$oldBasenameStart*" );

  #------------------------------------------
  # FINISHED
  #------------------------------------------

  #--- Tell the result
  noticeBox ( true, "Finished $basename.<br />Have a look at <a href='../misc/export.html'>the results</a>." );

  #--- Return to /admin
  chdir( '..' );
}

#----------------------------------------------------------------------
function getTableCreationSql ( $tableName, $query ) {
#----------------------------------------------------------------------

  #--- Get the creator code
  dbCommand( "DROP TABLE IF EXISTS wca_export_helper" );
  dbCommand( "CREATE TABLE wca_export_helper $query LIMIT 0" );
  $rows = dbQuery( "SHOW CREATE TABLE wca_export_helper" );
  dbCommand( "DROP TABLE IF EXISTS wca_export_helper" );
  $creator = str_replace( 'wca_export_helper', $tableName, $rows[0][1] );

  #--- Return DROP and CREATE
  return "\nDROP TABLE IF EXISTS `$tableName`;\n$creator;\n\n";
}

#----------------------------------------------------------------------
function getTsvHeader ( $dbResult ) {
#----------------------------------------------------------------------

  #--- Extract the column names and return a TSV head row
  for ( $i=0; $i<mysql_num_fields($dbResult); $i++ ) {
    $meta = mysql_fetch_field( $dbResult, $i );
    $head[] = $meta->name;
  }
  return implode( "\t", $head ) . "\n";
}

#----------------------------------------------------------------------
function instantiateTemplate( $filename, $replacements ) {
#----------------------------------------------------------------------

  #--- Read template, fill data, write output
  $contents = file_get_contents( "template.$filename" );
  $contents = preg_replace( '/\[(\w+)\]/e', '$replacements[\'$1\']', $contents );
  file_put_contents( $filename, $contents );
}

#----------------------------------------------------------------------
function mySystem ( $command ) {
#----------------------------------------------------------------------

  #--- Show the command, execute it, show the result
  echo "<p>Executing <span style='background:#FF0'>" . preg_replace( '/--password=\S+/', '--password=########', $command ) . "</span></p>";
  system( $command, $retval );
  echo '<p>'.( $retval ? "<span style='background:#F00'>Error [$retval]</span>"
                       : "<span style='background:#0F0'>Success!</span>" ).'</p>';
}
