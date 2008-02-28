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
      AND competition.id = competitionId
      AND round.id = roundId
    ORDER BY
      event.rank, year DESC, month DESC, day DESC, competitionCellName, roundId DESC
  ");

  tableBegin( 'results', 8 );
  tableCaption( false, 'History' );

  #--- Process results by event.
  foreach( structureBy( $results, 'eventId' ) as $eventResults ){
    extract( $eventResults[0] );

    #--- Announce the event.
    tableCaptionNew( false, $eventId, eventLink( $eventId, $eventName ));
    tableHeader( split( '\\|', 'Competition|Round|Place|Best||Average||Result Details' ),
                 array( 2 => 'class="r"', 3 => 'class="R"', 5 => 'class="R"', 7 => 'class="f"' ));

    #--- Initialize.
    $currentCompetitionId = '';

    #--- Show the results.
    foreach( $eventResults as $result ){
      extract( $result );

      $isNewCompetition = ($competitionId != $currentCompetitionId);
      $currentCompetitionId = $competitionId;

      tableRowStyled( ($isNewCompetition ? '' : 'color:#AAA'), array(
        ($isNewCompetition ? competitionLink( $competitionId, $competitionCellName ) : ''),
        $roundCellName,
        ($isNewCompetition ? "<b>$pos</b>" : $pos),
        formatValue( $best, $valueFormat ),
        $regionalSingleRecord,
        formatValue( $average, $valueFormat ),
        $regionalAverageRecord,
        formatAverageSources( true, $result, $valueFormat )
      ));
    }
  }
  tableEnd();
}

?>
