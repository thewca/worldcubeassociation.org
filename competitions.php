<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';

require( '_framework.php' );
analyzeChoices();

if( $chosenMap ){
  
  require( 'map.php' );
  exit;
}

require( '_header.php' );

offerChoices();
listCompetitions();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenRegionId, $chosenYears, $chosenList, $chosenMap;

  $chosenEventId  = getNormalParam( 'eventId' );
  $chosenRegionId = getNormalParam( 'regionId' );
  $chosenYears    = getNormalParam( 'years' );
  $chosenList     = getBooleanParam( 'list' );
  $chosenMap      = getBooleanParam( 'map' );

  if ( ! $chosenList && ! $chosenMap ){
    $chosenYears = "current";
  }
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenRegionId, $chosenYears, $chosenList, $chosenMap;

  displayChoices( array(
    eventChoice( false ),
    regionChoice( true ),
    yearsChoice( true, true, false, true ),
    choiceButton( $chosenList, 'list', 'List' ),
    choiceButton( $chosenMap, 'map', 'Map' )
  ));
}

#----------------------------------------------------------------------
function listCompetitions () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenYears, $chosenRegionId;

  #--- Prepare stuff for the query.
  if( $chosenEventId )
    $eventCondition = "AND eventSpecs REGEXP '[[:<:]]${chosenEventId}[[:>:]]'";
  $yearCondition = yearCondition();
  if( $chosenRegionId  &&  $chosenRegionId != 'World' )
    $regionCondition = "AND (competition.countryId = '$chosenRegionId' OR continentId = '$chosenRegionId')"; #TODP: remove the 'competition.' once we get countryId out of the Results table.

  #--- Get data of the (matching) competitions.
  $competitions = dbQuery("
    SELECT DISTINCT
      competition.*,
      country.name AS countryName
    FROM
      Competitions competition,
      Countries    country
    WHERE 1
      AND country.id = countryId
      AND showAtAll = 1
      $eventCondition
      $yearCondition
      $regionCondition
    ORDER BY
      year DESC, month DESC, day DESC
  ");

  tableBegin( 'results', 5 );
  tableCaption( false, spaced(array( eventName($chosenEventId), chosenRegionName(), $chosenYears )));
  tableHeader( split( '\\|', 'Year|Date|Name|Country, City|Venue' ),
               array( 4 => 'class="f"' ));

  foreach( $competitions as $competition ){
    extract( $competition );

    if( $previousYear  &&  $year != $previousYear )
      tableRowEmpty();
    $previousYear = $year;

    $isPast = date( 'Ymd' ) > (10000*$year + 100*$month + $day);

    tableRow( array(
      $year,
      competitionDate( $competition ),
      $isPast ? competitionLink( $id, $cellName ) : (( $showPreregForm || $showPreregList ) ? competitionLinkClassed( 'rg', $id, $cellName ) : competitionLinkClassed( 'fc', $id, $cellName )),
      "<b>$countryName</b>, $cityName",
      processLinks( $venue )
    ));
  }

  tableEnd();
}

?>
