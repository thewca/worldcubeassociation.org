<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
require( 'competition_edit_Model.php' );
require( 'competition_edit_View.php' );

analyzeChoices();
adminHeadline( 'Edit competition' );

specifyModel();
if( loadData() ){
  checkData();
  storeData();
  showView();
}

require( '../_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenSubmit;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenSubmit = getBooleanParam( 'submit' );
}

#----------------------------------------------------------------------
function loadData () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenSubmit, $data;

  #--- Load the competition data from the database.
  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );
  
  #--- Check the competitionId.
  if( count( $results ) != 1 ){
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  #--- Competition exists, so get its data.
  $data = $results[0];
  
  #--- If this is just view, not yet submit, extract the database data and return;
  if( ! $chosenSubmit ){
  
    #--- Extract the events.
    $eventSpecsTree = readEventSpecs( $data['eventSpecs'] );
    foreach( $eventSpecsTree as $eventId => $eventSpec ) {
      $data["offer$eventId"] = 1;
      foreach( array( 'personLimit', 'timeLimit', 'timeFormat', 'qualify', 'qualifyTimeLimit' ) as $param )
        $data["$param$eventId"] = $eventSpec["$param"];
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
