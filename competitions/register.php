<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '../_header.php' );

processPreregistration();

require( '../_footer.php' );

#----------------------------------------------------------------------
function processPreregistration () {
#----------------------------------------------------------------------

  #--- Define the table name.
  $tableName = 'PreRegs';
  
  #--- Define the text parameters.
  $textKeys = 'compId:50 fname:50 lname:50 country:50 dob:50 email:50 guest:text volunteer:text comments:text';

  #--- Create the table (if it doesn't exist yet).
  createTableIfDoesntExist( $tableName, $textKeys );
  
  #--- Insert the form data into the table and send an email to Ron.
  insertFormDataIntoTableAndMailRon( $tableName, $textKeys );
  
  #--- Say thanks.
  echo "<p>Thanks for preregistering. Blah...</p>";
  
  #--- Show the current preregistrants.
  showPreregistrants();  
}

#----------------------------------------------------------------------
function createTableIfDoesntExist ( $tableName, $textKeys ) {
#----------------------------------------------------------------------

  #--- Abort if the table already exists.
  if( count( dbQuery( "SHOW TABLES LIKE '$tableName'" )) )
    return;
  
  #--- Collect text columns.
  foreach( split( ' ', $textKeys ) as $key ){
    list( $key, $type ) = split( ':', $key );
    if( $type != 'text' ) $type = "varchar($type) NOT NULL default ''";
    $columns[] = "`$key` $type";    
  }

  #--- Collect event columns.
  foreach( getAllEvents() as $event ){
    $key = $event['id'];
    $columns[] = "`E$key` bool NOT NULL default FALSE";
  }
  
  #--- Build and execute the SQL command.
  dbCommand(
    "CREATE TABLE `$tableName` (\n  " .  
    implode( ",\n  ", $columns ) .
    "\n) ENGINE=MyISAM DEFAULT CHARSET=latin1"
  );
}

#----------------------------------------------------------------------
function insertFormDataIntoTableAndMailRon ( $tableName, $textKeys ) {
#----------------------------------------------------------------------
  
  #--- Collect text values.
  foreach( split( ' ', $textKeys ) as $key ){
    list( $key, $type ) = split( ':', $key );
    $value = myParam( $key );
    $values[] = "'$value'";
    $email .= sprintf( "%10s '$value'\n", $key );
  }
  
  #--- Collect event values.
  foreach( getAllEvents() as $event ){
    $key = $event['id'];
    $value = (myParam( $key ) == 'yes') ? 'TRUE' : 'FALSE';
    $values[] = "$value";    
    $email .= sprintf( "%10s $value\n", $key );    
  }

  #--- Build and execute the SQL command.
  dbCommand(
    "INSERT INTO `$tableName` VALUES (\n  " .
    implode( ",\n  ", $values ) .
    "\n)"
  );
  
  #--- Send values as email as well.
  mail(
#    "pochmann@rbg.informatik.tu-darmstadt.de",
#    "ron@speedcubing.com",
    "wc2007@speedcubing.com",
    "WC2007 PreReg - " . myParam( 'fname' ) . " " . myParam( 'lname' ),
    $email
  );
}

#----------------------------------------------------------------------
function showPreregistrants () {
#----------------------------------------------------------------------

  #--- Define which texts to show.
  $keys = split( ' ', 'fname lname country' );
  $names = split( '#', 'First name#Last name#Citizen of' );

  #--- Get the competition ID.
  $competitionId = myParam( 'compId' );
  
  #--- Add the events of the competition.
  $tmp = dbQuery( "SELECT eventSpecs FROM Competitions WHERE id='$competitionId'" );
  $tmp = $tmp[0];
  $eventSpecs = $tmp['eventSpecs'];
  
  #--- Add the events to show.
  foreach( split( ' ', $eventSpecs ) as $eventSpec ){
    $eventId = preg_replace( '/=.*/', '', $eventSpec );
    $event = getEvent( $eventId );
    $keys[] = "E$eventId";
    $names[] = $eventId;
  }

  #--- Get the preregistrants for the competition.
  $preregs = dbQuery("
    SELECT " . implode( ',', $keys ) . "
    FROM PreRegs
    WHERE compId='$competitionId'
  ");

#print_r( $preregs );

  #--- Begin the table.
  tableBegin( 'results', count( $names ));
  tableCaption( false, "Preregistered so far:" );
  tableHeader( $names, array() );

  #--- Add the preregs to the table.
  foreach( $preregs as $prereg ){
    $cells = array();
    foreach( $keys as $key )
      $cells[] = $prereg[$key];
    tableRow( $cells );
  }

  #--- Finish the table.
  tableEnd();
}

#----------------------------------------------------------------------
function myParam ( $key ) {
#----------------------------------------------------------------------
  
  return mysql_real_escape_string( getRawParamThisShouldBeAnException( $key ));
}

?>
