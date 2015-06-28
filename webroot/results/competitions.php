<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
$currentSection = "persons";
$mapsAPI = true;

require( 'includes/_header.php' );

analyzeChoices();
offerChoices();
listCompetitions();

require( 'includes/_footer.php' );

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
  if ( ! $chosenMap )
    $chosenList = true;

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
    array(
      choiceButton( $chosenList, 'list', 'List' ),
      choiceButton( $chosenMap, 'map', 'Map' ),
    )
  ));
}

#----------------------------------------------------------------------
function getCompetitions ( $sortList ) {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenRegionId, $chosenPatternMysql;

  #--- Prepare stuff for the query.
  $eventCondition = "";
  $regionCondition = "";
  $nameCondition = "";
  if( $chosenEventId )
    $eventCondition = "AND eventSpecs REGEXP '[[:<:]]${chosenEventId}[[:>:]]'";
  $yearCondition = yearCondition();
  if( $chosenRegionId  &&  $chosenRegionId != 'World' )
    $regionCondition = "AND (competition.countryId = '$chosenRegionId' OR continentId = '$chosenRegionId')"; #TODP: remove the 'competition.' once we get countryId out of the Results table.
  foreach( explode( ' ', $chosenPatternMysql ) as $namePart )
    $nameCondition .= " AND (competition.cellName like '%$namePart%' OR
                             cityName             like '%$namePart%' OR
                             venue                like '%$namePart%')";
  $orderBy = $sortList ? 'year DESC, month DESC, day DESC' : 'longitude, year, month, day';

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
  global $chosenList, $chosenMap;
  global $chosenCompetitions;

  $chosenCompetitions = getCompetitions( $chosenList );

  tableBegin( 'results', 5 );
  tableCaption( false, spaced(array( eventName($chosenEventId), chosenRegionName(), $chosenYears, $chosenPatternHtml ? "\"$chosenPatternHtml\"" : '' )));

  if( $chosenList ){ 

    tableHeader( explode( '|', 'Year|Date|Name|Country, City|Venue' ),
                 array( 4 => 'class="f"' ));

    foreach( $chosenCompetitions as $competition ){
      extract( $competition );

      if( isset( $previousYear )  &&  $year != $previousYear )
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
  }

  tableEnd();


  if( $chosenMap ) {
    // create map markers
    $markers = array();
    foreach($chosenCompetitions as $comp) {
      $markers[$comp['id']] = array();
      $markers[$comp['id']]['latitude'] = $comp['latitude'];
      $markers[$comp['id']]['longitude'] = $comp['longitude'];
      $markers[$comp['id']]['info'] = "<a href='c.php?i=".$comp['id']."'>" . o($comp['cellName']) . "</a><br />"
        . date("M j, Y", mktime(0,0,0,$comp['month'],$comp['day'],$comp['year']))
        . " - " . o($comp['cityName']);
    }
    displayMap($markers);
  }
}

