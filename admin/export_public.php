<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
showDescription();
exportPublic();
require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script does *not* affect the database.<br><br>Exports the database to the public.</a>.</b></p><hr>";
}

#----------------------------------------------------------------------
function exportPublic () {
#----------------------------------------------------------------------
  global $configDatabaseHost, $configDatabaseUser, $configDatabasePass, $configDatabaseName;

  #--- Load the local configuration data.
  require( '../framework/_config.php' );

  #--- Define what we want
  $mysqldumpOptions = "--add-drop-table --default-character-set=latin1 --host=$configDatabaseHost -u $configDatabaseUser -p$configDatabasePass $configDatabaseName";
  $mysqldumpTables = "Competitions Continents Countries Events Formats Persons Results Rounds CompetitionsMedia";

  #--- We'll work in the /admin/export directory
  chdir( 'export' );

  #--- Get old and new serial number
  $oldSerial = file_get_contents( "serial.txt" );
  $serial = $oldSerial + 1;
  file_put_contents( "serial.txt", $serial );
  
  #--- Build the file basename
  $basename         = sprintf( "WCA_export%03d_%s", $serial,    wcaDate( 'Ymd' ) );
  $oldBasenameStart = sprintf( "WCA_export%03d_", $oldSerial );
  
  #--- Build the README file
  instantiateTemplate( 'README.template.txt', array( 'longDate' => wcaDate( 'F j, Y' ) ) );

  #--- Build the SQL file
  $sqlFile = "$basename.sql";
  echo "<p>Creating: [$sqlFile]</p>";
  system( "mysqldump $mysqldumpOptions $mysqldumpTables > $sqlFile", $retval );
  report( $retval );
  
  #--- Build the SQL.ZIP file
  $sqlZipFile  = "$sqlFile.zip";
  system( "zip $sqlZipFile README.txt $sqlFile", $retval );
  report( $retval );
  
  #--- Build the INDEX file
  instantiateTemplate( 'index.template.html', array(
                       'sqlFile'        => $sqlFile,
                       'sqlZipFile'     => $sqlZipFile,
                       'sqlZipFileSize' => sprintf( "%.1f MB", filesize( $sqlZipFile ) / 1000000 ),
                       'tsvFile'        => $tsvFile,
                       'tsvZipFile'     => $tsvZipFile,
                       'tsvZipFileSize' => sprintf( "%.1f MB", filesize( $tsvZipFile ) / 1000000 ) ) );
  
  #--- Delete files we don't need anymore
  echo "<p>rm README.txt $sqlFile $oldBasenameStart*</p>";
  system( "rm README.txt $sqlFile $oldBasenameStart*", $retval );
  report( $retval );

  #--- Return to /admin
  chdir( '..' );
}

function instantiateTemplate( $templateFile, $replacements ) {
  $contents = file_get_contents( $templateFile );
  $contents = preg_replace( '/\[(\w+)\]/e', '$replacements[$1]', $contents );
  $outputFile = preg_replace( '/\.template/', '', $templateFile );
  file_put_contents( $outputFile, $contents );
}

function report ( $retval ) {
  echo "<p>" . ($retval ? "Error [$retval]" : "Success!") . "</p>";
}

?>
