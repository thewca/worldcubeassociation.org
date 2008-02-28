<?php

#----------------------------------------------------------------------
function showCompetitionResults () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;
  global $chosenAllResults, $chosenTop3, $chosenWinners;

  #--- Get the results.
  $competitionResults = getCompetitionResults();
   
  startTimer();
  tableBegin( 'results', 8 );

  if( $chosenWinners )
    tableHeader( split( '\\|', 'Event|Person|Best||Average||Citizen of|Result Details' ),
                 array( 2 => 'class="R"', 4 => 'class="R"', 7 => 'class="f"' ));

  if( $chosenTop3 )
      tableHeader( split( '\\|', 'Place|Person|Best||Average||Citizen of|Result Details' ),
                   array( 0 => 'class="r"', 2 => 'class="R"', 4 => 'class="R"', 7 => 'class="f"' ));
    
  foreach( $competitionResults as $result ){
    extract( $result );

    $isNewEvent = ($eventId != $currentEventId);
    $isNewRound = ($roundId != $currentRoundId);

    #--- Welcome new events.
    $winnerEvent = '';
    if( $isNewEvent ){
      $internalEventHref = "c.php?i=$chosenCompetitionId&amp;allResults=1#$eventId";

      if( $chosenTop3 )
        tableCaption( false, internalEventLink( $internalEventHref, $eventName ));

      if( $chosenWinners )
        $winnerEvent = internalEventLink( $internalEventHref, $eventCellName );

      if( $chosenAllResults  &&  $currentEventId ){
        tableRowBlank();
        tableRowBlank();
      }
    }

    #--- Welcome new rounds.
    if( $chosenAllResults  &&  ($isNewEvent  ||  $isNewRound) ){

      $anchors = ($isNewEvent ? "$eventId " : "") . "${eventId}_$roundId";
      $eventHtml = eventLink( $eventId, $eventName );
      $caption = spaced( array( $eventHtml, $roundName, $formatName ));
      tableCaptionNew( false, $anchors, $caption );

      $headerAverage    = ($formatId == 'a'  ||  $formatId == 'm') ? 'Average' : '';
      $headerAllResults = ($formatId != '1') ? 'Result Details' : '';
      tableHeader( split( '\\|', "Place|Person|Best||$headerAverage||Citizen of|$headerAllResults" ),
                   array( 0 => 'class="r"', 2 => 'class="R"', 4 => 'class="R"', 7 => 'class="f"' ));
    }

    #--- One result row.
    tableRow( array(
      ($chosenWinners ? $winnerEvent : $pos),
      personLink( $personId, $personName ),
      formatValue( $best, $valueFormat ),
      $regionalSingleRecord,
      formatValue( $average, $valueFormat ),
      $regionalAverageRecord,
      $countryName,
      formatAverageSources( $formatId != '1', $result, $valueFormat )
    ));

    $currentEventId = $eventId;
    $currentRoundId = $roundId;
  }

  tableEnd();
  stopTimer( "printing the huge table" );
}

#----------------------------------------------------------------------
function getCompetitionResults () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenAllResults, $chosenTop3, $chosenWinners;

  #--- Some filter conditions depending on the view (winners, top3, all).
  if( $chosenTop3 )
    $viewCondition = "AND roundId in ('f', 'c') AND pos <= 3";
  if( $chosenWinners )
    $viewCondition = "AND roundId in ('f', 'c') AND pos <= 1";

  #--- Get and return the results.
  return dbQuery("
    SELECT
                     result.*,
                     
      event.name     eventName,
      round.name     roundName,
      format.name    formatName,
      country.name   countryName,

      event.cellName eventCellName,
      event.format   valueFormat
    FROM
      Results   result,
      Events    event,
      Rounds    round,
      Formats   format,
      Countries country
    WHERE ".randomDebug()."
      AND competitionId = '$chosenCompetitionId'
      AND event.id      = eventId
      AND round.id      = roundId
      AND format.id     = formatId
      AND country.id    = countryId
      $viewCondition
    ORDER BY
      event.rank, roundId, pos, average, best, personName
  ");
}

?>
