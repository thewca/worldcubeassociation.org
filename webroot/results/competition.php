<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( 'includes/_header.php' );

#--- Get the parameters.
analyzeChoices();

#--- Get all competition infos.
$competition = getFullCompetitionInfos( $chosenCompetitionId );

#--- If competition not found, say so and stop.
if( ! $competition || ! $competition['showAtAll'] ){
  noticeBox( false, "Unknown competition ID \"$chosenCompetitionId\"" );
  require( 'includes/_footer.php' );
  exit( 0 );
}

#--- Show competition infos.
require( 'includes/competition_infos.php' );
showCompetitionInfos();

if( wcaDate( 'Ymd' ) >= (10000*$competition['year'] + 
                           100*$competition['month'] + 
                               $competition['day']) ){

  #--- Try the cache
  # tryCache( 'competition', $chosenCompetitionId, $chosenByPerson, $chosenAllResults, $chosenTop3, $chosenWinners );

  #--- Show competition results...
  offerChoicesResults();
  require( 'includes/competition_results.php' );
  if( $chosenByPerson )
    showCompetitionResultsByPerson();
  else
    showCompetitionResults();
}

else if( $competition['showPreregForm'] || $competition['showPreregList'] ){
  #--- Show the prereg form.
  offerChoicesPrereg();
  require( 'competition_registration.php' );
  if( $chosenList ){
    if( $competition['showPreregList'] ) showPreregList();
    else showPreregForm();
  }
  else {
    if( $competition['showPreregForm'] ) showPreregForm();
    else showPreregList();
  }
}

require( 'includes/_footer.php' );

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
    array(
      choiceButton( $chosenWinners,    'winners',    'Winners' ),
      choiceButton( $chosenTop3,       'top3',       'Top 3' ),
      choiceButton( $chosenAllResults, 'allResults', 'All Results' ),
      choiceButton( $chosenByPerson,   'byPerson',   'By Person' ),
      "<input type='hidden' name='competitionId' value='$chosenCompetitionId' />",
    ),
  ));
}

#----------------------------------------------------------------------
function offerChoicesPrereg () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenForm, $chosenList;
  global $competition;

  echo "<div class='form-group'>";
  if( $competition['showPreregForm'] ) {
    echo "<a href='/competitions/$chosenCompetitionId/register' class='butt'>Registration Form</a>";
  }
  if( $competition['showPreregList'] ) {
    echo "<a href='/competitions/$chosenCompetitionId/registrations' class='butt'>List of Registered Competitiors</a>";
  }
  echo "</div>";

}
?>
