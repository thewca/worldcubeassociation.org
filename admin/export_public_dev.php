<?php

$currentSection = 'admin';
require( '../includes/_header.php' );
adminHeadline('Export to public');

echo "<p>This creates the <a href='../misc/export.html'>public export</a> of our database.</p><hr />";

$chosenExport = getNormalParam('export');
displayChoices( array(
  choiceButton( true, 'export', ' Export now ' )
));


if($chosenExport){
  // Export data.

  #------------------------------------------
  # PREPARATION
  #------------------------------------------

  $queries_to_export = array(
    'Results'      => 'SELECT   competitionId, eventId, roundId, pos,
                                best, average,
                                personName, personId, countryId AS personCountryId,
                                formatId, value1, value2, value3, value4, value5,
                                regionalSingleRecord, regionalAverageRecord
                       FROM     Results',
    'RanksSingle'  => 'SELECT personId, eventId, best, worldRank, continentRank, countryRank FROM RanksSingle',
    'RanksAverage' => 'SELECT personId, eventId, best, worldRank, continentRank, countryRank FROM RanksAverage',
    'Rounds'       => 'SELECT * FROM Rounds',
    'Events'       => 'SELECT * FROM Events',
    'Formats'      => 'SELECT * FROM Formats',
    'Countries'    => 'SELECT * FROM Countries',
    'Continents'   => 'SELECT * FROM Continents',
    'Persons'      => 'SELECT id, subid, name, countryId, gender FROM Persons',
    'Competitions' => 'SELECT id, name, cityName, countryId, information, year,
                              month, day, endMonth, endDay, eventSpecs,
                              wcaDelegate, organiser, venue, venueAddress,
                              venueDetails, website, cellName, latitude, longitude
                       FROM Competitions',
  );

  #--- No PHP timeout
  set_time_limit(0);

  #--- We'll work in the /admin/export directory
  chdir(__DIR__ . '/export');

  #--- Get old and new serial number
  $oldSerial = file_get_contents('serial.txt') * 1;
  $serial = $oldSerial + 1;
  file_put_contents('serial.txt', $serial);

  #--- Build the file basename
  $basename         = sprintf('WCA_export%03d_%s', $serial, wcaDate('Ymd'));
  $oldBasenameStart = sprintf('WCA_export%03d_', $oldSerial);

  #--- Get DataBase CredentialS for dump statements
  $dbcs = $config->get('database');


  #------------------------------------------
  # SQL + TSVs
  #------------------------------------------

  echo "<p><strong>Build TSV and SQL files</strong></p>";

  #--- Create temporary tables (needed for mysqldump)
  foreach ($queries_to_export as $table_name => $SQL) {
    startTimer();

    $command = 'DROP TABLE IF EXISTS _tmp_export_table_' . $table_name;
    $wcadb_conn->dbCommand($command);
    $command = 'CREATE TABLE _tmp_export_table_' . $table_name . ' AS (' . $SQL . ')';
    $wcadb_conn->dbCommand($command);

    stopTimer($table_name . "-Creation");
  }

  #--- Export TSVs
  foreach ($queries_to_export as $table_name => $SQL) {
    startTimer();

    $command = 'mysql -u ' . $dbcs['user']
             . ' --password=\'' . $dbcs['pass'] . '\''
             . ' -h ' . $dbcs['host']
             . ' -A ' . $dbcs['name']
             . ' --default-character-set=utf8 '
             . ' -e "SELECT * FROM _tmp_export_table_' . $table_name . '"'
             . ' > WCA_export_' . $table_name . '.tsv';
    mySystem($command);

    stopTimer($table_name . "-TSV-Dump");
  }

  #--- Export SQL
  $sqlFile = 'WCA_export.sql';
  $tables = '';
  foreach ($queries_to_export as $table_name => $SQL) {
    $tables .= ' _tmp_export_table_' . $table_name;
  }
  $command = 'mysqldump -n'
           . ' -u ' . $dbcs['user']
           . ' --password=\'' . $dbcs['pass'] . '\''
           . ' -h ' . $dbcs['host']
           . ' -r ' . $sqlFile        // preserves encoding
           . ' ' . $dbcs['name']
           . ' ' . $tables;
  startTimer();
  mySystem($command);
  // get rid of table prefixes (this might accidentally get rid of text... need something better)
  mySystem('sed -i \'s/_tmp_export_table_//g\' ' . $sqlFile);
  stopTimer("SQL-Dump");

  #--- Remove temp tables
  foreach ($queries_to_export as $table_name => $SQL) {
    $command = 'DROP TABLE _tmp_export_table_' . $table_name;
    $wcadb_conn->dbCommand($command);
  }

  #------------------------------------------
  # README
  #------------------------------------------

  #--- Build the README file
  echo "<p><strong>Build the README file</strong></p>";
  instantiateTemplate( 'README.txt', array( 'longDate' => wcaDate( 'F j, Y' ) ) );

  #------------------------------------------
  # ZIPs
  #------------------------------------------

  #--- Build the ZIP files
  echo "<p><strong>Build the ZIP files</strong></p>";
  $sqlZipFile  = $basename . '.sql.zip';
  $tsvZipFile  = $basename . '.tsv.zip';
  mySystem( "zip $sqlZipFile README.txt $sqlFile" );
  mySystem( "zip $tsvZipFile README.txt *.tsv" );

  #------------------------------------------
  # HTML
  #------------------------------------------

  #--- Build the HTML file
  echo '<p><strong>Build the HTML file</strong></p>';
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
  echo '<p><strong>Move new files to public directory</strong></p>';
  mySystem( "mv $sqlZipFile $tsvZipFile ../../misc/" );
  mySystem( "mv export.html ../../misc/" );

  #------------------------------------------
  # CLEAN UP
  #------------------------------------------

  #--- Delete temporary and old stuff we don't need anymore
  echo "<p><strong>Delete temporary and old stuff we don't need anymore</strong></p>";
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


require( '../includes/_footer.php' );





/* helper functions for above script */

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
