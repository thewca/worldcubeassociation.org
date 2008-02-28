<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '_header.php' );

#--- Get the parameters.
analyzeChoices();

#--- Get all competition infos.
$competition = getFullCompetitionInfos( $chosenCompetitionId );

#--- If competition not found, say so and stop.
if( ! $competition ){
  noticeBox( false, "Unknown competition ID \"$chosenCompetitionId\"" );
  require( '_footer.php' );
  exit( 0 );
}

#--- Display the standard infos+results?  
if( $displayStandard ){

  #--- Show competition infos.
  require( 'competition_infos.php' );
  showCompetitionInfos();
  
  #--- Show competition results (optional, controlled by flag).
  if( true || $competition['showResults'] ){
    offerChoices();
    require( 'competition_results.php' );
    showCompetitionResults();
  }
}

#--- Show the prereg form?
if( $displayPreregForm )
  showPreregForm();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;
  global $chosenAllResults, $chosenTop3, $chosenWinners;
  global $displayStandard, $displayPreregForm;

  $chosenCompetitionId = getNormalParam( 'competitionId' );

  $chosenAllResults    = getBooleanParam( 'allResults' );
  $chosenTop3          = getBooleanParam( 'top3' );
  $chosenWinners       = getBooleanParam( 'winners' );
  if( !$chosenAllResults  &&  !$chosenTop3 )
    $chosenWinners = true;
    
  $displayPreregForm = getBooleanParam( 'preregForm' );
  $displayStandard = ! $displayPreregForm;
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenAllResults, $chosenTop3, $chosenWinners;

  displayChoices( array(
    choiceButton( $chosenWinners,    'winners',    'Winners' ),
    choiceButton( $chosenTop3,       'top3',       'Top 3' ),
    choiceButton( $chosenAllResults, 'allResults', 'All Results' ),
    "<input type='hidden' name='competitionId' value='$chosenCompetitionId' />"
  ));
}

#----------------------------------------------------------------------
function showPreregForm () {
#----------------------------------------------------------------------
  require_once( 'competition_prereg_form.php' );
  
  showPreregFormNow();
}


?>
