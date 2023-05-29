<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );

analyzeChoices();
showDescription();
showResults();

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenNameHtml, $chosenNameMysql, $chosenCountryIdHtml, $chosenCountryIdMysql, $chosenPersonIdHtml, $chosenPersonIdMysql;

  $chosenNameHtml       = getHtmlParam(  'name' );
  $chosenNameMysql      = getMysqlParam( 'name' );
  $chosenCountryIdHtml  = getHtmlParam(  'countryId' );
  $chosenCountryIdMysql = getMysqlParam( 'countryId' );
  $chosenPersonIdHtml       = getHtmlParam(  'personId' );
  $chosenPersonIdMysql      = getMysqlParam( 'personId' );
}

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------
  global $chosenNameHtml, $chosenCountryIdHtml, $chosenPersonIdHtml;

  echo "<p>This page shows results where...<ul><li>personName = <b>$chosenNameHtml</b></li><li>countryId = <b>$chosenCountryIdHtml</b></li><li>personId = <b>$chosenPersonIdHtml</b></li></ul></p>";

  echo "<hr>";
}

#----------------------------------------------------------------------
function showResults () {
#----------------------------------------------------------------------
  global $chosenNameMysql, $chosenCountryIdMysql, $chosenPersonIdMysql;

  $results = dbQuery("
    SELECT
                           result.*,
      event.name           eventName,
      competition.cellName competitionCellName,
      event.format         valueFormat,
      roundType.cellName   roundCellName
    FROM
      Results result,
      Events  event,
      Competitions competition,
      RoundTypes roundType
    WHERE ".randomDebug()."
      AND result.personName = '$chosenNameMysql'
      AND result.countryId  = '$chosenCountryIdMysql'
      AND result.personId = '$chosenPersonIdMysql'
      AND event.id = eventId
      AND event.rank < 990
      AND competition.id = competitionId
      AND roundType.id = roundTypeId
    ORDER BY
      event.rank, year DESC, month DESC, day DESC, competitionCellName, roundType.rank DESC
  ");

  tableBegin( 'results', 8 );

  #--- Process results by event.
  foreach( structureBy( $results, 'eventId' ) as $eventResults ){
    extract( $eventResults[0] );

    #--- Announce the event.
    tableCaptionNew( false, $eventId, eventLink( $eventId, $eventName ));
    tableHeader( explode( '|', 'Competition|Round|Place|Best||Average||Result Details' ),
                 array( 2 => 'class="r"', 3 => 'class="R"', 5 => 'class="R"', 7 => 'class="f"' ));

    #--- Initialize.
    $currentCompetitionId = '';

    #--- Compute PB Markers
    //$pbMarkers = [];
    $bestBest = 9999999999;
    $bestAverage = 9999999999;
    foreach( array_reverse( $eventResults ) as $result ){
      extract( $result );

      $pbMarkers[$competitionId][$roundCellName] = 0;
      if( $best > 0 && $best <= $bestBest ){
        $bestBest = $best;
        $pbMarkers[$competitionId][$roundCellName] += 1;
      }
      if( $average > 0 && $average <= $bestAverage ){
        $bestAverage = $average;
        $pbMarkers[$competitionId][$roundCellName] += 2;
      }
     }

    #--- Show the results.
    foreach( $eventResults as $result ){
      extract( $result );

      $isNewCompetition = ($competitionId != $currentCompetitionId);
      $currentCompetitionId = $competitionId;

      $formatBest = formatValue( $best, $valueFormat );
      if ($pbMarkers[$competitionId][$roundCellName] % 2)
        $formatBest = "<span style='color:#F60;font-weight:bold'>$formatBest</span>";

      $formatAverage = formatValue( $average, $valueFormat );
      if ($pbMarkers[$competitionId][$roundCellName] > 1)
        $formatAverage = "<span style='color:#F60;font-weight:bold'>$formatAverage</span>";

      tableRowStyled( ($isNewCompetition ? '' : 'color:#AAA'), array(
        ($isNewCompetition ? competitionLink( $competitionId, $competitionCellName ) : ''),
        $roundCellName,
        ($isNewCompetition ? "<b>$pos</b>" : $pos),
        $formatBest,
        $regionalSingleRecord,
        $formatAverage,
        $regionalAverageRecord,
        formatAverageSources( true, $result, $valueFormat )
      ));
    }
  }
  tableEnd();
}
