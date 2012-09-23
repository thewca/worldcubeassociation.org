<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../_header.php' );
adminHeadline( 'Finish unfinished persons', 'persons_finish_unfinished' );
showDescription();

finishUnfinishedPersons();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>The following commands were executed.</p>\n";
  
  echo "<hr />\n";
}

#----------------------------------------------------------------------
function finishUnfinishedPersons () {
#----------------------------------------------------------------------

  #--- Process all cases.
  while( true ){

    #--- Get old name and country from the case.
    $caseNr++;
    $oldNameAndCountry = getRawParamThisShouldBeAnException( "oldNameAndCountry$caseNr" );
    
    #--- If empty, we've reach the end of the list and can stop.
    if( ! $oldNameAndCountry )
      break;

    #--- Separate old name and country, and get the action.
    list( $oldName, $oldCountry ) = explode( '|', $oldNameAndCountry );    
    $action = getRawParamThisShouldBeAnException( "action$caseNr" );

    #--- If no action or 'skip' chosen, skip it.
    if( ! $action  ||  $action == 'skip' )
      continue;
    
    #--- If 'new' chosen, treat the person as new.
    if( $action == 'new' ){
      
      #--- First get the new name, country, and semi-id.
      $newName    = getRawParamThisShouldBeAnException( "name$caseNr" );
      $newCountry = getRawParamThisShouldBeAnException( "country$caseNr" );
      $newSemiId  = getRawParamThisShouldBeAnException( "semiId$caseNr" );

      #--- Complete the id.
      $newId = completeId( $newSemiId );
      
      #--- Insert the new person into the Persons table.
      insertPerson( $newName, $newCountry, $newId );

      #--- Adapt the Results table entries.
      adaptResults( $oldName, $oldCountry, $newName, $newCountry, $newId );
    }
    #--- Otherwise adopt another personality.
    else {
    
      #--- Scream if error.      
      if( count( explode( '|', $action )) != 3 ){
        showErrorMessage( "invalid action '$action'" );
        continue;
      }
      
      #--- Get the data from the other person.
      list( $newName, $newCountry, $newId ) = explode( '|', $action );

      #--- Adapt the Results table entries.
      adaptResults( $oldName, $oldCountry, $newName, $newCountry, $newId );      
    }
    
    #--- Separator after each person.
    echo "<hr>";
  }
}

#----------------------------------------------------------------------
function completeId ( $newSemiId ) {
#----------------------------------------------------------------------
  global $doesPersonIdExist;
  
  #--- Load all existing person ids if we haven't done that yet.
  if( ! $doesPersonIdExist )
    foreach( dbQuery( "SELECT * FROM Persons" ) as $person )
      $doesPersonIdExist[$person['id']] = true;
  
  #--- Now search for the free running number to append to the semiId.
  foreach( range( 1, 99 ) as $i ){
    $newId = $newSemiId . sprintf( "%02d", $i );
    if( ! $doesPersonIdExist[$newId] ){
      $doesPersonIdExist[$newId] = true;
      return $newId;
    }
  }

  #--- None found? We're doomed!
  showErrorMessage( "Can't append a running number to semiId '$semiId'" );
}

#----------------------------------------------------------------------
function insertPerson( $newName, $newCountry, $newId ) {
#----------------------------------------------------------------------

  #--- Mysql-ify.
  $newName      = mysqlEscape( $newName );
  $newCountry   = mysqlEscape( $newCountry );
  $newId        = mysqlEscape( $newId );

  #--- Build the command.  
  $command = "
    INSERT INTO Persons (id, subId, name, countryId, gender, year, month, day, comments)
    VALUES ( '$newId', 1, '$newName', '$newCountry', '', 0, 0, 0, '' ) 
  ";

  #--- Show the command.
  echo colorize( $command );
  
  #--- Execute the command.
  dbCommand( $command );
}

#----------------------------------------------------------------------
function adaptResults ( $oldName, $oldCountry, $newName, $newCountry, $newId ) {
#----------------------------------------------------------------------

  #--- Mysql-ify.
  $oldName    = mysqlEscape( $oldName );
  $oldCountry = mysqlEscape( $oldCountry );
  $newName    = mysqlEscape( $newName );
  $newCountry = mysqlEscape( $newCountry );
  $newId      = mysqlEscape( $newId );

  #--- Build the command.  
  $command = "
    UPDATE Results
    SET personName='$newName', countryId='$newCountry', personId='$newId'
    WHERE personName='$oldName' AND countryId='$oldCountry' AND personId=''
  ";
  
  #--- Show the command.
  echo colorize( $command );
  
  #--- Execute the command.
  dbCommand( $command );
}

#----------------------------------------------------------------------
function colorize ( $command ) {
#----------------------------------------------------------------------

  #--- Highlight the SETs.
  $command = preg_replace (
    "/(SET|,) (\w+)(=')(.*?)(')/",
    '$1 <span style="font-weight:bold">$2</span>$3<span style="font-weight:bold;color:#3C3">$4</span>$5',
    $command
  );

  #--- Highlight the WHEREs.
  $command = preg_replace (
    "/(WHERE|AND) (\w+)(=')(.*?)(')/",
    '$1 <span style="font-weight:bold">$2</span>$3<span style="font-weight:bold;color:#F00">$4</span>$5',
    $command
  );

  #--- Break into lines.
  $command = preg_replace (
    "/(SET|WHERE|VALUES)/",
    '<br />$1',
    $command
  );

  #--- Highlight the SQL keywords.
  $command = preg_replace (
    "/([A-Z]{3,100} )/",
    '<span style="font-weight:bold;color:#33F">$1</span>',
    $command
  );

  #--- Highlight the new personIds.
  $command = preg_replace (
    "/(\( ')(\d{4}\w{4}\d{2})(')/",
    '$1<span style="font-weight:bold;color:#F0F">$2</span>$3',
    $command
  );
  
  #--- Put in own paragraph.
  return "<p>$command</p>";
}

?>
