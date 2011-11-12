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
  global $chosenEventId, $chosenRegionId, $chosenYears, $chosenPatternHtml, $chosenPatternMysql, $chosenList, $chosenMap;

  $chosenEventId  = getNormalParam( 'eventId' );
  $chosenRegionId = getNormalParam( 'regionId' );
  $chosenPatternHtml  = getHtmlParam( 'pattern' );
  $chosenPatternMysql = getMysqlParam( 'pattern' );
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
  global $chosenEventId, $chosenRegionId, $chosenYears, $chosenPatternHtml, $chosenList, $chosenMap;

  displayChoices( array(
    eventChoice( false ),
    regionChoice( true ),
    yearsChoice( true, true, false, true ),
    textFieldChoice( 'pattern', 'Name, City or Venue', $chosenPatternHtml ),
    choiceButton( $chosenList, 'list', 'List' ),
    choiceButton( $chosenMap, 'map', 'Map' )
  ));
}

#----------------------------------------------------------------------
function getCompetitions ( $for = 'list' ) {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenRegionId, $chosenPatternMysql;

  #--- Prepare stuff for the query.
  if( $chosenEventId )
    $eventCondition = "AND eventSpecs REGEXP '[[:<:]]${chosenEventId}[[:>:]]'";
  $yearCondition = yearCondition();
  if( $chosenRegionId  &&  $chosenRegionId != 'World' )
    $regionCondition = "AND (competition.countryId = '$chosenRegionId' OR continentId = '$chosenRegionId')"; #TODP: remove the 'competition.' once we get countryId out of the Results table.
  foreach( explode( ' ', $chosenPatternMysql ) as $namePart )
    $nameCondition .= " AND (competition.cellName like '%$namePart%' OR
                             cityName             like '%$namePart%' OR
                             venue                like '%$namePart%')";
  $orderBy = ($for == 'list') ? 'year DESC, month DESC, day DESC' : 'longitude, year, month, day';

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
      $nameCondition
    ORDER BY
      $orderBy
  ");

  #--- Return them
  return $competitions;
}

#----------------------------------------------------------------------
function listCompetitions () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenYears, $chosenRegionId, $chosenPatternHtml;

  $competitions = getCompetitions();

  tableBegin( 'results', 5 );
  tableCaption( false, spaced(array( eventName($chosenEventId), chosenRegionName(), $chosenYears, $chosenPatternHtml ? "\"$chosenPatternHtml\"" : '' )));
  tableHeader( explode( '\\|', 'Year|Date|Name|Country, City|Venue' ),
               array( 4 => 'class="f"' ));

  foreach( $competitions as $competition ){
    extract( $competition );

    if( $previousYear  &&  $year != $previousYear )
      tableRowEmpty();
    $previousYear = $year;

    $isPast = wcaDate( 'Ymd' ) > (10000*$year + 100*$month + $day);

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
