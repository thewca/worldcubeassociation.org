<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
showDescription();
exportPublic( array(
  "Results"      => "*",
  "Rounds"       => "*",
  "Events"       => "*",
  "Formats"      => "*",
  "Countries"    => "*",
  "Continents"   => "*",
	"Persons"      => "SELECT id, subid, name, countryId, gender FROM Persons",
  "Competitions" => "SELECT id, name, cityName, countryId, information, year,
                            month, day, endMonth, endDay, eventSpecs,
                            wcaDelegate, organiser, venue, venueAddress,
                            venueDetails, website, cellName, latitude, longitude
                     FROM Competitions",
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

  #--- Get old and new serial number
  $oldSerial = file_get_contents( "serial.txt" );
  $serial = $oldSerial + 1;
  file_put_contents( "serial.txt", $serial );
  
  #--- Build the file basename
  $basename         = sprintf( "WCA_export%03d_%s", $serial,    wcaDate( 'Ymd' ) );
  $oldBasenameStart = sprintf( "WCA_export%03d_", $oldSerial );

  #--- Prepare the sources
  foreach ( $sources as $tableName => $tableSource ) {
    if ( $tableSource != '*' ) {
      $tableName = "tmpXAK_$tableName";
      dbCommand( "DROP TABLE IF EXISTS $tableName" );
      dbCommand( "CREATE TABLE $tableName $tableSource" );
    }
    $tableNames[] = $tableName;
  }

  #--- Build the README file
  instantiateTemplate( 'README.txt', array( 'longDate' => wcaDate( 'F j, Y' ) ) );

  #--- Build the SQL file
  $sqlFile = "$basename.sql";
  echo "<p><b>Creating: [$sqlFile]</b></p>";
  $mysqldumpOptions = "--add-drop-table --default-character-set=latin1 --host=$configDatabaseHost -u $configDatabaseUser -p$configDatabasePass $configDatabaseName";
  $mysqldumpTables = implode( ' ', $tableNames );
  mySystem( "mysqldump $mysqldumpOptions $mysqldumpTables | perl -pe 's/tmpXAK_//g' > $sqlFile" );
  
  #--- Build the SQL.ZIP file
  $sqlZipFile  = "$sqlFile.zip";
  mySystem( "zip $sqlZipFile README.txt $sqlFile" );
  echo "<p><b>Creating: [$sqlZipFile]</b></p>";
  
  #--- Build the INDEX file
  instantiateTemplate( 'export.html', array(
                       'sqlFile'        => $sqlFile,
                       'sqlZipFile'     => $sqlZipFile,
                       'sqlZipFileSize' => sprintf( "%.1f MB", filesize( $sqlZipFile ) / 1000000 ),
                       'tsvFile'        => $tsvFile,
                       'tsvZipFile'     => $tsvZipFile,
                       'tsvZipFileSize' => sprintf( "%.1f MB", filesize( $tsvZipFile ) / 1000000 ) ) );
  
  #--- Delete files we don't need anymore
  echo "<p>rm README.txt $sqlFile $oldBasenameStart*</p>";
  mySystem( "rm README.txt $sqlFile $oldBasenameStart*" );

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
  echo "<p>Executing <span style='background:#0F0'>$command</span></p>";
  system( $command, $retval );
  echo "<p>" . ($retval ? "Error [$retval]" : "Success!") . "</p>";
}

?>
