<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'regions';
require( '_header.php' );

analyzeChoices();
offerChoices();
showRecords();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenRegionId, $chosenEventId, $chosenYears;
  global $chosenMixed, $chosenSlim, $chosenSeparate, $chosenHistory;

  $chosenRegionId = getNormalParam( 'regionId' );
  $chosenEventId  = getNormalParam( 'eventId' );
  $chosenYears    = getNormalParam( 'years' );

  $chosenMixed    = getBooleanParam( 'mixed' );
  $chosenSlim     = getBooleanParam( 'slim' );
  $chosenSeparate = getBooleanParam( 'separate' );
  $chosenHistory  = getBooleanParam( 'history' );

  if( !$chosenSlim && !$chosenSeparate && !$chosenHistory )
    $chosenMixed = true;
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenMixed, $chosenSlim, $chosenSeparate, $chosenHistory;

  displayChoices( array(
    regionChoice( false ),
    eventChoice( false ),
    yearsChoice( true, false, true, false ),
    choiceButton( $chosenMixed,    'mixed',    'Mixed' ),
    choiceButton( $chosenSlim,     'slim',     'Slim' ),
    choiceButton( $chosenSeparate, 'separate', 'Separate' ),
    choiceButton( $chosenHistory,  'history',  'History' )
  ));
}

#----------------------------------------------------------------------
function showRecords () {
#----------------------------------------------------------------------
  global $chosenMixed, $chosenSlim, $chosenSeparate, $chosenHistory;

  if( $chosenMixed    ) require( 'regions_mixed.php' );
  if( $chosenSlim     ) require( 'regions_slim.php' );
  if( $chosenSeparate ) require( 'regions_separate.php' );
  if( $chosenHistory  ) require( 'regions_history.php' );
}

?>
