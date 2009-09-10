<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '_header.php' );
require( 'competition_edit_Model.php' );
require( 'competition_edit_View.php' );

analyzeChoices();
specifyModel();
if( checkPasswordAndLoadData() ){
  checkData();
  storeData();
  showView();
}

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $chosenSubmit;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenPassword = getNormalParam( 'password' );
  $chosenSubmit = getBooleanParam( 'submit' );
}

#----------------------------------------------------------------------
function checkPasswordAndLoadData () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $chosenSubmit, $data;

  #--- Load the competition data from the database.
  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );
  
  #--- Check the competitionId.
  if( count( $results ) != 1 ){
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  #--- Competition exists, so get its data.
  $data = $results[0];

  #--- Check the password.
  if( $chosenPassword != $data['password'] ){
    showErrorMessage( "wrong password" );
    return false;
  }
  
  #--- If this is just view, not yet submit, extract the database data and return;
  if( ! $chosenSubmit ){
  
    #--- Extract the events.
    foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event ){
      extract( $event );
  
      if( preg_match( "/(^| )$id\b(=(\d*)\/(\d*)\/(\w*)\/(\d*)\/(\d*))?/", $data['eventSpecs'], $matches )){
        $data["offer$id"] = 1;
        $data["personLimit$id"]      = $matches[3];
        $data["timeLimit$id"]        = $matches[4];
        $data["timeFormat$id"]       = $matches[5];
        $data["qualify$id"]          = $matches[6];
        $data["qualifyTimeLimit$id"] = $matches[7];
      }
    }
    
    #--- Done.
    return true;
  }
  
  #--- Set the data to the entered values.
  $data = getRawParamsThisShouldBeAnException();
  $data['id'] = $chosenCompetitionId;

  return true;
}

?>
