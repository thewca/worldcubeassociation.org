<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'events';
require( '_header.php' );

analyzeChoices();
offerChoices();
showResults();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenRegionId, $chosenYears, $chosenShow;
  global $chosenSingle, $chosenAverage;

  $chosenEventId  = getNormalParamDefault( 'eventId', '333' );
  $chosenRegionId = getNormalParam( 'regionId' );
  $chosenYears    = getNormalParam( 'years' );
  $chosenShow     = getNormalParamDefault( 'show', '100 Persons' );

  $chosenSingle   = getBooleanParam( 'single' );
  $chosenAverage  = getBooleanParam( 'average' );

  if( ! $chosenAverage )
    $chosenSingle = true;
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenShow, $chosenSingle, $chosenAverage;

  displayChoices( array(
    eventChoice( true ),
    regionChoice( false ),
    yearsChoice( true, false, true, true ),
    choice( 'show', 'Show', array(
      array( '100 Persons', '100 Persons' ),
      array( '1000 Persons', '1000 Persons' ),
      array( 'By Region',   'By Region' ),
      array( '100 Results', '100 Results' ),
      array( '1000 Results', '1000 Results' ),
      ), $chosenShow ),
    choiceButton( $chosenSingle,  'single', 'Single' ),
    choiceButton( $chosenAverage, 'average', 'Average' )
  ));
}

#----------------------------------------------------------------------
function showResults () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenRegionId, $chosenYears, $chosenShow, $chosenSingle, $chosenAverage;

  #--- Try the cache
  tryCache( 'event', $chosenEventId, preg_replace( '/ /', '', $chosenRegionId ), $chosenYears, preg_replace( '/ /', '', $chosenShow ), $chosenSingle, $chosenAverage );

  #------------------------------
  # Prepare stuff for the query.
  #------------------------------

  $eventCondition = eventCondition();
  $yearCondition  = yearCondition();
  $regionCondition = regionCondition( 'result' );
  if ( preg_match( '/^10+/', $chosenShow, $matches ) ) {
    $limitNumber = $matches[0];
    $limitCondition = 'LIMIT ' . 2*$limitNumber;
  }

  $valueSource = $chosenAverage ? 'average' : 'best';
  $valueName   = $chosenAverage ? 'Average' : 'Single';

  #------------------------------
  # Get results from database.
  #------------------------------
  if( $chosenShow == 'By Region' ){
    require( 'events_regions.php' );
    return;
  }
  if( $chosenShow == '100 Results' || $chosenShow == '1000 Results' )
    require( 'events_results.php' );
  else
    require( 'events_persons.php' );

  #------------------------------
  # Show the table.
  #------------------------------
  startTimer();

  $event = getEvent( $chosenEventId );

  tableBegin( 'results', 6 );
  tableCaption( true, spaced( array(
    $event['name'],
    chosenRegionName(),
    $chosenYears,
    $chosenShow
  )));
  $headerSources = $chosenAverage ? 'Result Details' : '';
  tableHeader( explode( '|', "Rank|Person|Result|Citizen of|Competition|$headerSources" ),
               array( 0=>"class='r'", 2=>"class='R2'", 5=>'class="f"' ));

  foreach( $results as $result ){
    extract( $result );
    $ctr++;
    $no = ($value == $previousValue) ? '&nbsp;' : $ctr;
    if( $limitCondition  &&  $no > $limitNumber )
      break;
    tableRow( array(
      $no,
      personLink( $personId, $personName ),
      formatValue( $value, $event['format'] ),
      htmlEntities( $countryName ),
      competitionLink( $competitionId, $competitionName ),
      formatAverageSources( $chosenAverage, $result, $event['format'] )
    ));
    $previousValue = $value;
  }
  tableEnd();

  stopTimer( "printing the table" );
}

?>
