<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'regions';
require( 'includes/_header.php' );

analyzeChoices();
offerChoices();
showRecords();

require( 'includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenRegionId, $chosenEventId, $chosenYears;
  global $chosenMixed, $chosenSlim, $chosenSeparate, $chosenHistory, $chosenMixHist;

  $chosenRegionId = getNormalParam( 'regionId' );
  $chosenEventId  = getNormalParam( 'eventId' );
  $chosenYears    = getNormalParam( 'years' );

  $chosenMixed    = getBooleanParam( 'mixed' );
  $chosenSlim     = getBooleanParam( 'slim' );
  $chosenSeparate = getBooleanParam( 'separate' );
  $chosenHistory  = getBooleanParam( 'history' );
  $chosenMixHist  = getBooleanParam( 'mixHist' );

  if( !$chosenSlim && !$chosenSeparate && !$chosenHistory && !$chosenMixHist )
    $chosenMixed = true;
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenMixed, $chosenSlim, $chosenSeparate, $chosenHistory, $chosenMixHist;

  displayChoices( array(
    regionChoice( false ),
    eventChoice( false ),
    yearsChoice( true, false, true, false ),
    choiceButton( $chosenMixed,    'mixed',    'Mixed' ),
    choiceButton( $chosenSlim,     'slim',     'Slim' ),
    choiceButton( $chosenSeparate, 'separate', 'Separate' ),
    choiceButton( $chosenHistory,  'history',  'History' ),
    choiceButton( $chosenMixHist,  'mixHist',  'Mixed History' )
  ));
}

#----------------------------------------------------------------------
function showRecords () {
#----------------------------------------------------------------------
  global $chosenRegionId, $chosenEventId, $chosenYears;
  global $chosenMixed, $chosenSlim, $chosenSeparate, $chosenHistory, $chosenMixHist;

  #--- Try the cache
  tryCache( 'region', preg_replace( '/ /', '', $chosenRegionId ), $chosenEventId, $chosenYears,
                      $chosenMixed, $chosenSlim, $chosenSeparate, $chosenHistory, $chosenMixHist ); 

  if( $chosenMixed    ) require( 'includes/regions_mixed.php' );
  if( $chosenSlim     ) require( 'includes/regions_slim.php' );
  if( $chosenSeparate ) require( 'includes/regions_separate.php' );
  if( $chosenHistory  ) require( 'includes/regions_history.php' );
  if( $chosenMixHist  ) require( 'includes/regions_mixed_history.php' );
}

?>
