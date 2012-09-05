<?php

#----------------------------------------------------------------------
function showCompetitionResults () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;
  global $chosenByPerson, $chosenAllResults, $chosenTop3, $chosenWinners;

  #--- Get the results.
  $competitionResults = getCompetitionResults();
   
  startTimer();
  tableBegin( 'results', 8 );

  if( $chosenWinners )
    tableHeader( explode( '|', 'Event|Person|Best||Average||Citizen of|Result Details' ),
                 array( 2 => 'class="R"', 4 => 'class="R"', 7 => 'class="f"' ));

  if( $chosenTop3 )
      tableHeader( explode( '|', 'Place|Person|Best||Average||Citizen of|Result Details' ),
                   array( 0 => 'class="r"', 2 => 'class="R"', 4 => 'class="R"', 7 => 'class="f"' ));
    
  foreach( $competitionResults as $result ){
    extract( $result );

    $isNewEvent = (! isset( $currentEventId ) || $eventId != $currentEventId);
    $currentEventId = $eventId;
    $isNewRound = (! isset( $currentRoundId ) || $roundId != $currentRoundId);
    $currentRoundId = $roundId;

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

      $anchors = ($isNewEvent ? "$eventId " : "") . "e${eventId}_$roundId";
      $eventHtml = eventLink( $eventId, $eventName );
      $caption = spaced( array( $eventHtml, $roundName, $formatName, "<a href='#e${eventId}_$roundId'>link</a>" ));
      tableCaptionNew( false, $anchors, $caption );

      $headerAverage    = ($formatId == 'a'  ||  $formatId == 'm') ? 'Average' : '';
      $headerAllResults = ($formatId != '1') ? 'Result Details' : '';
      tableHeader( explode( '|', "Place|Person|Best||$headerAverage||Citizen of|$headerAllResults" ),
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

  }

  tableEnd();
  stopTimer( "printing the huge table" );
}

#----------------------------------------------------------------------
function showCompetitionResultsByPerson () {
#----------------------------------------------------------------------
  global $chosenByPerson, $chosenAllResults, $chosenTop3, $chosenWinners;
  global $chosenCompetitionId;

  #--- Get the results.
  $competitionResults = getCompetitionResults();
   
  startTimer();
  tableBegin( 'results', 8 );

    
  foreach( $competitionResults as $result ){
    extract( $result );

    $isNewPerson = (! isset( $currentPersonId ) || $personId != $currentPersonId);
    $isNewEvent = (! isset( $currentEventId ) || $eventId != $currentEventId || $isNewPerson);

    #--- Welcome new persons.
    if( $isNewPerson ){
      if( isset( $currentPersonId )){
        tableRowBlank();
      }

      $headerAverage    = ($formatId == 'a'  ||  $formatId == 'm') ? 'Average' : '';
      $headerAllResults = ($formatId != '1') ? 'Result Details' : '';

      tableCaptionNew( false, $personId, spaced( array( personLink( $personId, $personName ), $countryName )));
      tableHeader( explode( '|', "Event|Round|Place|Best||$headerAverage||$headerAllResults" ),
                   array( 2 => 'class="r"', 3 => 'class="R"', 5 => 'class="R"', 7 => 'class="f"' ));


    }

    #--- One result row.
    tableRowStyled( ($isNewEvent ? '' : 'color:#AAA'), (array(
      ($isNewEvent ? eventLink( $eventId, $eventCellName ) : ''),
      $roundCellName,
      ($isNewEvent ? "<b>$pos</b>" : $pos),
      formatValue( $best, $valueFormat ),
      $regionalSingleRecord,
      formatValue( $average, $valueFormat ),
      $regionalAverageRecord,
      formatAverageSources( $formatId != '1', $result, $valueFormat )
    )));

    $currentPersonId = $personId;
    $currentEventId  = $eventId;
  }

  tableEnd();
  stopTimer( "printing the huge table" );
}

#----------------------------------------------------------------------
function getCompetitionResults () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenByPerson, $chosenAllResults, $chosenTop3, $chosenWinners;

  #--- Some filter conditions depending on the view (winners, top3, all).
  $viewCondition = "";
  if( $chosenTop3 )
    $viewCondition = "AND roundId in ('f', 'c') AND pos <= 3";
  if( $chosenWinners )
    $viewCondition = "AND roundId in ('f', 'c') AND pos <= 1";

  if( $chosenByPerson )
    $order = "personName, event.rank, round.rank DESC";
  else
    $order = "event.rank, round.rank, pos, average, best, personName";

  #--- Get and return the results.
  return dbQuery("
    SELECT
                     result.*,
                     
      event.name      eventName,
      round.name      roundName,
      round.cellName  roundCellName,
      format.name     formatName,
      country.name    countryName,

      event.cellName  eventCellName,
      event.format    valueFormat
    FROM
      Results      result,
      Events       event,
      Rounds       round,
      Formats      format,
      Countries    country,
      Competitions competition
    WHERE ".randomDebug()."
      AND competitionId = '$chosenCompetitionId'
      AND competition.id = '$chosenCompetitionId'
      AND event.id      = eventId
      AND round.id      = roundId
      AND format.id     = formatId
      AND country.id    = result.countryId
      AND (( event.id <> '333mbf' ) OR (( competition.year = 2009 ) AND ( competition.month > 1 )) OR ( competition.year > 2009 ))
      $viewCondition
    ORDER BY
      $order
  ");
}

?>
