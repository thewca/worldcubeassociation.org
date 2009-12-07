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

  #--- The prefix for the temporary tables
  $tmpPrefix = 'tmpXAK_';
  
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

  #--- Prepare the sources
  foreach ( $sources as $tableName => $tableSource ) {
    if ( $tableSource != '*' ) {
      $tableName = "$tmpPrefix$tableName";
      dbCommand( "DROP TABLE IF EXISTS $tableName" );
      dbCommand( "CREATE TABLE $tableName $tableSource" );
    }
    $tableNames[] = $tableName;
  }

  #------------------------------------------
  # README
  #------------------------------------------

  #--- Build the README file
  echo "<p><b>Build the README file</b></p>";
  instantiateTemplate( 'README.txt', array( 'longDate' => wcaDate( 'F j, Y' ) ) );

  #------------------------------------------
  # SQL
  #------------------------------------------

  #--- Build the SQL file
  echo "<p><b>Build the SQL file</b></p>";
  $sqlFile = "$basename.sql";
  $configDatabaseHost = str_replace( ':', ' --port=', $configDatabaseHost );
  $mysqldumpOptions = "-e --add-drop-table --default-character-set=latin1 --compress --host=$configDatabaseHost --user=$configDatabaseUser --password=$configDatabasePass $configDatabaseName";
  $mysqldumpTables = implode( ' ', $tableNames );
  mySystem( "mysqldump $mysqldumpOptions $mysqldumpTables | perl -pe 's/$tmpPrefix//g; s/^---/-- /' > $sqlFile" );

  #--- Build the SQL.ZIP file
  echo "<p><b>Build the SQL.ZIP file</b></p>";
  $sqlZipFile  = "$sqlFile.zip";
  echo "<p><b>Creating: [$sqlZipFile]</b></p>";
  mySystem( "zip $sqlZipFile README.txt $sqlFile" );

  #------------------------------------------
  # TSV
  #------------------------------------------

  #--- Build the TSV files
  echo '<p><b>Build the TSV files</b></p>';
  foreach ( $tableNames as $tableName ) {

    #--- Do the query
    $dbResult = mysql_query( "SELECT * FROM $tableName" )
      or die( '<p>Unable to perform database query.<br/>\n(' . mysql_error() . ')</p>\n' );

    #--- Reset $values, add head row
    unset( $values, $head );
    for ( $i=0; $i<mysql_num_fields($dbResult); $i++ ) {
      $meta = mysql_fetch_field( $dbResult, $i );
      $head[] = $meta->name;
    }
    $values[] = implode( "\t", preg_replace( '/\s+/', ' ', $head ) ) . "\n";

    #--- Add data rows
    while ( $row = mysql_fetch_array( $dbResult, MYSQL_NUM ) )
      $values[] = implode( "\t", preg_replace( array('/^\s+|\s+$/','/\s+/'), array('',' '),$row ) ) . "\n";

    #--- Free the query result
    mysql_free_result( $dbResult );

    #--- Store the tsv file
    $tableName = str_replace( $tmpPrefix, '', $tableName );
    file_put_contents( "$tableName.tsv", $values );
  }

  #--- Build the TSV.ZIP file
  echo '<p><b>Build the TSV.ZIP file</b></p>';
  $tsvZipFile  = "$basename.tsv.zip";
  mySystem( "zip $tsvZipFile README.txt *.tsv" );

  #------------------------------------------
  # EXPORT.HTML
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
  # CLEAN UP and DEPLOY
  #------------------------------------------

  #--- Delete temporary stuff we don't need anymore
  echo '<p><b>Delete temporary stuff we don\'t need anymore</b></p>';
  mySystem( "rm README.txt $sqlFile *.tsv" );
  foreach ( $tableNames as $tableName )
    if ( preg_match( "/^$tmpPrefix/", $tableName ) )
      dbCommand( "DROP TABLE IF EXISTS $tableName" );

  #--- Move new files to public directory
  echo '<p><b>Move new files to public directory</b></p>';
  mySystem( "mv $sqlZipFile $tsvZipFile ../../misc/" );
  mySystem( "mv export.html ../../misc/" );

  #--- Delete previous files from public directory
  echo '<p><b>Delete previous files from public directory</b></p>';
  mySystem( "rm ../../misc/$oldBasenameStart*" );

  #--- Return to /admin
  chdir( '..' );
}

#--- Instantiate template: Read template, fill data, write output
function instantiateTemplate( $filename, $replacements ) {
  $contents = file_get_contents( "template.$filename" );
  $contents = preg_replace( '/\[(\w+)\]/e', '$replacements[$1]', $contents );
  file_put_contents( $filename, $contents );
}

function mySystem ( $command ) {
  echo "<p>Executing <span style='background:#FF0'>" . preg_replace( '/--password=\S+/', '--password=########', $command ) . "</span></p>";
  system( $command, $retval );
  echo '<p>'.( $retval ? "<span style='background:#F00'>Error [$retval]</span>"
                       : "<span style='background:#0F0'>Success!</span>" ).'</p>';
}

?>