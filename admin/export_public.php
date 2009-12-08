<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
showDescription();
exportPublic( array(
  'Results'      => '*',
  'Rounds'       => '*',
  'Events'       => '*',
  'Formats'      => '*',
  'Countries'    => '*',
  'Continents'   => '*',
  'Persons'      => 'SELECT id, subid, name, countryId, gender FROM Persons',
  'Competitions' => 'SELECT id, name, cityName, countryId, information, year,
                            month, day, endMonth, endDay, eventSpecs,
                            wcaDelegate, organiser, venue, venueAddress,
                            venueDetails, website, cellName, latitude, longitude
                     FROM Competitions',
) );
require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script does *not* affect the database.<br><br>Exports the database to the public.</a>.</b></p><hr>";

  echo "<p style='font-size:3em;color:#F00'>Not finished! Don't make it public yet!</p>";
}

#----------------------------------------------------------------------
function exportPublic ( $sources ) {
#----------------------------------------------------------------------
  global $configDatabaseHost, $configDatabaseUser, $configDatabasePass, $configDatabaseName;

  #--- Load the local configuration data.
  require( '../framework/_config.php' );

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

    #--- Get the query
    $query = ($tableSource != '*') ? $tableSource : "SELECT * FROM $tableName";

    #--- Add the SQL for creating the table
    file_put_contents( $sqlFile, getTableCreationSql( $tableName, $query ), FILE_APPEND );

    #--- Do the query
    $dbResult = mysql_query( $query )
      or die( '<p>Unable to perform database query.<br/>\n(' . mysql_error() . ')</p>\n' );

    #--- Start the TSV file
    $tsvFile = "WCA_export_$tableName.tsv";
    file_put_contents( $tsvFile, getTsvHeader( $dbResult ) );

    #--- Add data rows
    unset( $tsv, $sqlInserts );
    while ( $row = mysql_fetch_array( $dbResult, MYSQL_NUM ) ) {
      $niceValues = preg_replace( array('/^\s+|\s+$/','/\s+/'), array('',' '), $row );
      $tsv .= implode( "\t", $niceValues ) . "\n";
      $sqlInserts[] = "('" . implode( "','", array_map( 'addslashes', $niceValues ) ) . "')";
      if ( strlen($tsv)>200000 ) {
        $sql = "INSERT INTO `$tableName` VALUES " . implode( ",\n", $sqlInserts ) . ";\n";
        file_put_contents( $tsvFile, $tsv, FILE_APPEND );
        file_put_contents( $sqlFile, $sql, FILE_APPEND );
        unset( $tsv, $sqlInserts );
      }
    }
    $sql = "INSERT INTO `$tableName` VALUES\n" . implode( ",\n", $sqlInserts ) . ";\n";
    file_put_contents( $tsvFile, $tsv, FILE_APPEND );
    file_put_contents( $sqlFile, $sql, FILE_APPEND );

    #--- Free the query result
    mysql_free_result( $dbResult );

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
  $contents = preg_replace( '/\[(\w+)\]/e', '$replacements[$1]', $contents );
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

?>