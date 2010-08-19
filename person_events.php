<?php

showResultsByEvents();

#----------------------------------------------------------------------
function showResultsByEvents () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  $results = dbQuery("
    SELECT
                           result.*,
      event.name           eventName,
      competition.cellName competitionCellName,
      event.format         valueFormat,
      round.cellName       roundCellName
    FROM
      Results result,
      Events  event,
      Competitions competition,
      Rounds round
    WHERE ".randomDebug()."
      AND personId = '$chosenPersonId'
      AND event.id = eventId
      AND event.rank < 999
      AND competition.id = competitionId
      AND round.id = roundId
    ORDER BY
      event.rank, year DESC, month DESC, day DESC, competitionCellName, round.rank DESC
  ");

  tableBegin( 'results', 8 );
  tableCaption( false, "History (<a href='#' onclick=\"javascript:window.open('person_map.php?i=$chosenPersonId', 'map', config='height=420, width=820, toolbar=0, menubar=0, scrollbars=0, resizable=0, location=0, directories=0, status=0')\">Map</a>)" );

  #--- Process results by event.
  foreach( structureBy( $results, 'eventId' ) as $eventResults ){
    extract( $eventResults[0] );

    #--- Announce the event.
    tableCaptionNew( false, $eventId, eventLink( $eventId, $eventName ));
    tableHeader( split( '\\|', 'Competition|Round|Place|Best||Average||Result Details' ),
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
      if ($best > 0 && $best <= $bestBest) {
        $bestBest = $best;
        $pbMarkers[$competitionId][$roundCellName] += 1;
      }
      if ($average > 0 && $average <= $bestAverage) {
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

?>
