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

#--- Show competition infos.
require( 'competition_infos.php' );
showCompetitionInfos();

if( date( 'Ymd' ) >= (10000*$competition['year'] + 
                        100*$competition['month'] + 
                            $competition['day']) ){

  #--- Show competition results...
  offerChoicesResults();
  require( 'competition_results.php' );
  if( $chosenByPerson )
    showCompetitionResultsByPerson();
  else
    showCompetitionResults();
}

else if( $competition['showPreregForm'] ){
  #--- Show the prereg form.
  offerChoicesPrereg();
  require( 'competition_registration.php' );
  if( $chosenList && $competition['showPreregList'] ) showPreregList();
  else showPreregForm();
}

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;
  global $chosenByPerson, $chosenAllResults, $chosenTop3, $chosenWinners;
  global $chosenForm, $chosenList;

  $chosenCompetitionId = getNormalParam( 'competitionId' );

  $chosenByPerson      = getBooleanParam( 'byPerson' );
  $chosenAllResults    = getBooleanParam( 'allResults' );
  $chosenTop3          = getBooleanParam( 'top3' );
  $chosenWinners       = getBooleanParam( 'winners' );
  if( !$chosenAllResults  &&  !$chosenTop3 && !$chosenByPerson )
    $chosenWinners = true;
    
  $chosenForm          = getBooleanParam( 'form' );
  $chosenList          = getBooleanParam( 'list' );
  if( !$chosenForm ) $chosenList = true;
}

#----------------------------------------------------------------------
function offerChoicesResults () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenByPerson, $chosenAllResults, $chosenTop3, $chosenWinners;

  displayChoices( array(
    choiceButton( $chosenWinners,    'winners',    'Winners' ),
    choiceButton( $chosenTop3,       'top3',       'Top 3' ),
    choiceButton( $chosenAllResults, 'allResults', 'All Results' ),
    choiceButton( $chosenByPerson,   'byPerson',   'By Person' ),
    "<input type='hidden' name='competitionId' value='$chosenCompetitionId' />"
  ));
}

#----------------------------------------------------------------------
function offerChoicesPrereg () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenForm, $chosenList;

  displayChoices( array(
    choiceButton( $chosenForm, 'form', 'Registration Form' ),
    choiceButton( $chosenList, 'list', 'List of Registered Competitiors' ),
    "<input type='hidden' name='competitionId' value='$chosenCompetitionId' />"
  ));
}



?>
