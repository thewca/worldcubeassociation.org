<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '_header.php' );

analyzeChoices();
offerChoices();
listCompetitions();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenRegionId, $chosenYears, $chosenShow;

  $chosenEventId  = getNormalParam( 'eventId' );
  $chosenRegionId = getNormalParam( 'regionId' );
  $chosenYears    = getNormalParam( 'years' );
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    eventChoice( false ),
    regionChoice( true ),
    yearsChoice( false, true ),
    choiceButton( true, 'filter', 'Filter' )
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

#    $date = 10000 * $year;
#    $date += 100 * ($endMonth ? $endMonth : $month);
#    $date += $endDay ? $endDay : $day;
#    $isPast = $date < date( 'Ymd' );
    $isPast = date( 'Ymd' ) > (10000*$year + 100*$month + $day);

    tableRow( array(
      $year,
      competitionDate( $competition ),
      $isPast ? competitionLink( $id, $cellName ) : competitionLinkClassed( 'fc', $id, $cellName ),
      "<b>$countryName</b>, $cityName",
      processLinks( $venue )
    ));
  }

  tableEnd();
}

?>
