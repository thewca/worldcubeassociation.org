<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( 'includes/_header.php' );

// functionality for competiton data form
require( 'includes/competition_edit_Model.php' );
require( 'includes/competition_edit_View.php' );

analyzeChoices();
specifyModel();
if(checkPasswordAndLoadData()) {

  if($isAdmin) {
    adminHeadline('Edit competition');
  }

  checkData();
  storeData();
  showView();
}

require( 'includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenSubmit, $chosenPassword, $chosenConfirm;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenPassword = getNormalParam( 'password' );
  $chosenSubmit = getBooleanParam( 'submit' );
  $chosenConfirm = getBooleanParam( 'confirm' );
  if( $chosenConfirm ) $chosenSubmit = true;
}

#----------------------------------------------------------------------
function checkPasswordAndLoadData () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $chosenSubmit, $chosenConfirm, $data, $isAdmin, $isConfirmed;

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
  if(( $chosenPassword != $data['organiserPassword'] ) && ( $chosenPassword != $data['adminPassword'] )){
    showErrorMessage( "wrong password" );
    return false;
  }

  #--- Check whether it is an organiser or an admin, and if the competition has been confirmed.
  if( $chosenPassword == $data['adminPassword'] )
    $isAdmin = true;
  if( $data['isConfirmed'] == 1 )
    $isConfirmed = true;

  #--- If this is just view, not yet submit, extract the database data and return;
  if( ! $chosenSubmit ){
  
    #--- Extract the events.
    $eventSpecsTree = readEventSpecs( $data['eventSpecs'] );
    foreach( $eventSpecsTree as $eventId => $eventSpec ) {
      $data["offer$eventId"] = 1;
      /*
      foreach( array( 'personLimit', 'timeLimit', 'timeFormat', 'qualify', 'qualifyTimeLimit' ) as $param )
        $data["$param$eventId"] = $eventSpec["$param"];
      */
    }
    
    #--- Done.
    return true;
  }
  
  #--- Set the data to the entered values.
  $data = getRawParamsThisShouldBeAnException();
  $data['id'] = $chosenCompetitionId;

  return true;
}
