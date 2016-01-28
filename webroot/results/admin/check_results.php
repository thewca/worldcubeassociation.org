<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
require( '../includes/_check.php' );
analyzeChoices();
adminHeadline( 'Check results' );

$scripts = new WCAClasses\WCAScripts();
$scripts->add('check_results_help.js');
print $scripts->getHTMLAll();

showDescription();
showChoices();

if( $chosenShow ) {
  switch ( $chosenWhat ){
    case '': # Run them all!
    case 'individual':
      checkIndividually();
      if($chosenWhat != '') {
        break;
      }
    case 'ranks':
      checkRelatively();
      if($chosenWhat != '') {
        break;
      }
    case 'similar':
      checkSimilarResults();
      if($chosenWhat != '') {
        break;
      }
  }
}

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p style='width:45em'>First, check the results individually, according to our <a href='check_results.txt'>checking procedure</a> (mostly that value1-value5 make sense and that average and best are correct).</p>\n";

  echo "<p style='width:45em'>Then, once they're correct individually, check ranks. This compares results with others in the same round to check each competitor's place. Differences between calculated and stored places can be agreed to and then executed on the bottom of the page.\n";

  echo "<p style='width:45em'>You can also print similar results that happened during a competition. It might reveal errors in score taking, although some similar results can be due to chance.</p>\n";

  echo "<hr />\n";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenCompetitionId, $chosenWhat, $chosenShow, $chosenWhich, $competitionCondition;

  $chosenEventId        = getNormalParam( 'eventId' );
  $chosenCompetitionId  = getNormalParam( 'competitionId' );
  $chosenWhat           = getNormalParam( 'what' );
  $chosenShow           = getBooleanParam( 'show' );

  $chosenWhich          = "";
  $chosenWhich .= $chosenEventId ? $chosenEventId : "all events";
  $chosenWhich .= " in " . ($chosenCompetitionId ? $chosenCompetitionId : "all competitions");
  $competitionCondition = eventCondition() . competitionCondition();
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------
  global $chosenWhat;
  displayChoices( array(
    eventChoice( false ),
    competitionChoice(),
    choice( 'what', 'What', array( array( '', 'All' ), array( 'individual', 'individual results' ), array( 'ranks', 'ranks' ), array( 'similar', 'similar results' )), $chosenWhat ),
    choiceButton( true, 'show', 'Show' )
  ));
}

#----------------------------------------------------------------------
function checkIndividually () {
#----------------------------------------------------------------------
  global $competitionCondition, $chosenWhich;

  echo "<hr /><p>Checking <b>" . $chosenWhich . " individual results</b>... (wait for the result message box at the end)</p>\n";

  #--- Get all results (id, values, format, round).
  $dbResult = mysql_query("
    SELECT
      result.id, formatId, roundId, personId, competitionId, eventId, result.countryId,
      value1, value2, value3, value4, value5, best, average
    FROM Results result, Competitions competition
    WHERE competition.id = competitionId
      $competitionCondition
    ORDER BY formatId, competitionId, eventId, roundId, result.id
  ")
    or die("<p>Unable to perform database query.<br/>\n(" . mysql_error() . ")</p>\n");

  #--- Build id sets
  $countryIdSet     = array_flip( getAllIDs( dbQuery( "SELECT id FROM Countries" )));
  $competitionIdSet = array_flip( getAllIDs( dbQuery( "SELECT id FROM Competitions" )));
  $eventIdSet       = array_flip( getAllIDs( dbQuery( "SELECT id FROM Events" )));
  $formatIdSet      = array_flip( getAllIDs( dbQuery( "SELECT id FROM Formats" )));
  $roundIdSet       = array_flip( getAllIDs( dbQuery( "SELECT id FROM Rounds" )));

  #--- Process the results.
  $badIds = array();
  echo "<pre>\n";
  while( $result = mysql_fetch_array( $dbResult )){
    if( $error = checkResult( $result, $countryIdSet, $competitionIdSet, $eventIdSet, $formatIdSet, $roundIdSet )){
      extract( $result );
      echo "Error: $error\nid:$id format:$formatId round:$roundId";
      echo " ($value1,$value2,$value3,$value4,$value5) best+average($best,$average)\n";
      echo "$personId   $countryId   $competitionId   $eventId\n\n";
      $badIds[] = $id;
    }
  }
  echo "</pre>";

  #--- Free the results.
  mysql_free_result( $dbResult );

  #--- Tell the result.
  noticeBox2(
    ! count( $badIds ),
    "All checked results pass our checking procedure successfully.<br />" . wcaDate(),
    count( $badIds ) . " errors found. Get them with this:<br /><br />SELECT * FROM Results WHERE id in (" . implode( ', ', $badIds ) . ")"
  );
}

#----------------------------------------------------------------------
function checkRelatively () {
#----------------------------------------------------------------------
  global $competitionCondition, $chosenWhich;

  echo "<hr /><p>Checking <b>" . $chosenWhich . " ranks</b>... (wait for the result message box at the end)</p>\n";

  #--- Get all results (except the trick-duplicated (old) multiblind)
  $rows = dbQueryHandle("
    SELECT   result.id, competitionId, eventId, roundId, formatId, average, best, pos, personName
    FROM     Results result, Competitions competition
    WHERE    competition.id = competitionId
      $competitionCondition
      AND    (( eventId <> '333mbf' ) OR (( competition.year = 2009 ) AND ( competition.month > 1 )) OR ( competition.year > 2009 ))
    ORDER BY year desc, month desc, day desc, competitionId, eventId, roundId, IF(formatId IN ('a','m') AND average>0, average, 2147483647), if(best>0, best, 2147483647), pos
  ");

  #--- Begin the form
  echo "<form action='check_results_ACTION.php' method='post'>\n";

  #--- Check the pos values
  $prevRound = $shownRound = '';
  $wrongs = $wrongRounds = 0;
  $wrongComp = array();
  while( $row = mysql_fetch_row( $rows ) ) {
    list( $resultId, $competitionId, $eventId, $roundId, $formatId, $average, $best, $storedPos, $personName ) = $row;
    $round = "$competitionId|$eventId|$roundId";
    if($formatId == 'm' || $formatId == 'a') {
      $result = "$average|$best";
    } else {
      $result = $best;
    }
    if ( $round != $prevRound )
      $ctr = $calcedPos = 1;
    if ( $ctr > 1  &&  $result != $prevResult )
      $calcedPos = $ctr;
    if ( $storedPos != $calcedPos ) {

      #--- Before the first difference in a round, show the round's full results
      if ( $round != $shownRound ) {
        $wrongRounds++;
        $wrongComp[$competitionId] = true;
        echo "<p style='margin-top:2em; margin-bottom:0'><a href='https://www.worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#e{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";
        showCompetitionResults( $competitionId, $eventId, $roundId );
        $shownRound = $round;

        #--- Show a check all and a check none button.
        printf( "<button class='js-check-all' data-round='$round'>Check all</button>" );
        printf( "<button class='js-check-none' data-round='$round'>Check none</button>" );
        printf( "<br>" );
      }

      #--- Show each difference, with a checkbox to agree
      $change = sprintf('%+d', $calcedPos-$storedPos);
      $checkbox = "<input type='checkbox' name='setpos$resultId' value='$calcedPos' data-round='$round' />";
      printf( "$checkbox Place $storedPos should be place $calcedPos (change by $change) --- $personName<br />" );
      $wrongs++;
    }
    $prevRound = $round;
    $prevResult = $result;
    $ctr++;
  }
  mysql_free_result( $rows );

  #--- Tell the result.
  $date = wcaDate();
  noticeBox2(
    ! $wrongs,
    "We agree about all checked places.<br />$date",
    "<p>Darn! We disagree: $wrongs possibly wrong places, in $wrongRounds rounds, in " . count($wrongComp) . " competitions<br /><br />$date</p>"
    ."<p>Choose the changes you agree with above, then click the 'Execute...' button below. It will result in something like the following.</p>"
    ."<pre>I'm doing this:\n"
    ."UPDATE Results SET pos=111 WHERE id=11111\n"
    ."UPDATE Results SET pos=222 WHERE id=22222\n"
    ."UPDATE Results SET pos=333 WHERE id=33333\n"
    ."</pre>"
  );

  #--- If differences were found, offer to fix them.
  if( $wrongs )
    echo "<center><input type='submit' value='Execute the agreed changes!' /></center>\n";

  #--- Finish the form.
  echo "</form>\n";
}

#----------------------------------------------------------------------
function showCompetitionResults ( $competitionId, $eventId, $roundId ) {
#----------------------------------------------------------------------

  # NOTE: This is mostly a copy of the same function in competition_results.php

  #--- Get the results.
  $competitionResults = getCompetitionResults( $competitionId, $eventId, $roundId );

  tableBegin( 'results', 8 );

  $prevEventId = $prevRoundId = '';
  foreach( $competitionResults as $result ){
    extract( $result );

    $isNewEvent = ($eventId != $prevEventId);
    $isNewRound = ($roundId != $prevRoundId);

    #--- Welcome new rounds.
    if( $isNewEvent  ||  $isNewRound ){

      $anchors = ($isNewEvent ? "$eventId " : "") . "${eventId}_$roundId";
      $eventHtml = eventLink( $eventId, $eventName );
      $caption = spaced( array( $eventHtml, $roundName, $formatName ));
      tableCaptionNew( false, $anchors, $caption );
      $bo3_as_mo3 = ($formatId=='3' && ($eventId=='333bf' || $eventId=='333fm' || $eventId=='333ft'));
      $headerAverage    = ($formatId == 'a'  ||  $formatId == 'm' || $bo3_as_mo3) ? 'Average' : '';
      $headerAllResults = ($formatId != '1') ? 'Result Details' : '';
      tableHeader( explode( '|', "Place|Person|Best||$headerAverage||Citizen of|$headerAllResults" ),
                   array( 0 => 'class="r"', 2 => 'class="R"', 4 => 'class="R"', 7 => 'class="f"' ));
    }

    #--- One result row.
    tableRow( array(
      $pos,
      personLink( $personId, $personName ),
      formatValue( $best, $valueFormat ),
      $regionalSingleRecord,
      formatValue( $average, $valueFormat ),
      $regionalAverageRecord,
      $countryName,
      formatAverageSources( $formatId != '1', $result, $valueFormat )
    ));

    $prevEventId = $eventId;
    $prevRoundId = $roundId;
  }

  tableEnd();
}

#----------------------------------------------------------------------
function getCompetitionResults ( $competitionId, $eventId, $roundId ) {
#----------------------------------------------------------------------

  # NOTE: This is mostly a copy of the same function in competition_results.php

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
      AND competitionId  = '$competitionId'
      AND competition.id = '$competitionId'
      AND eventId        = '$eventId'
      AND event.id       = '$eventId'
      AND roundId        = '$roundId'
      AND round.id       = '$roundId'
      AND format.id     = formatId
      AND country.id    = result.countryId
      AND (( event.id <> '333mbf' ) OR (( competition.year = 2009 ) AND ( competition.month > 1 )) OR ( competition.year > 2009 ))
    ORDER BY
      $order
  ");
}

#----------------------------------------------------------------------
function checkSimilarResults () {
#----------------------------------------------------------------------
  global $competitionCondition, $chosenWhich;

  echo "<hr /><p>Checking <b>" . $chosenWhich . " similar results</b>... (wait for the result message box at the end)</p>\n";

  #--- Get all similar results (except old-new multiblind)
  #    Note that we don't want to treat a particular result as looking
  #    similar to itself, so we don't allow for results with matching ids.
  #    Further more, if a result A is similar to a result B, we don't want to
  #    return both (A, B) and (B, A) as matching pairs, it's sufficient to just
  #    return (A, B), which is why we require Result.id < h.resultId.
  $rows = pdo_query( "
      SELECT
          Results.competitionId AS competitionId,
          Results.personId AS personIdA, Results.personName AS personNameA, Results.eventId AS eventIdA, Results.roundId AS roundIdA,
          h.personId AS personIdB, h.personName AS personNameB, h.eventId AS eventIdB, h.roundId AS roundIdB,
          Results.value1 AS value1A, Results.value2 AS value2A, Results.value3 AS value3A, Results.value4 AS value4A, Results.value5 AS value5A,
          h.value1 AS value1B, h.value2 AS value2B, h.value3 AS value3B, h.value4 AS value4B, h.value5 AS value5B
      FROM Results
      JOIN (
          SELECT Results.id as resultId, competitionId, eventId, roundId, personId, personName, value1, value2, value3, value4, value5
          FROM Results ".
          ($competitionCondition ? "JOIN Competitions ON Competitions.id = competitionId " : "").
         "WHERE best > 0 ".
              ($competitionCondition ? $competitionCondition : "").
            " AND value3 <> 0
              AND eventId <> '333mbo'
      ) h ON Results.competitionId = h.competitionId
          AND Results.id < h.resultId
          AND Results.eventId <> '333mbo'
          AND (
              (Results.value1 = h.value1 AND h.value1 > 0) +
              (Results.value2 = h.value2 AND h.value2 > 0) +
              (Results.value3 = h.value3 AND h.value3 > 0) +
              (Results.value4 = h.value4 AND h.value4 > 0) +
              (Results.value5 = h.value5 AND h.value5 > 0) > 2
              )
  " );

  tableBegin( 'results', 4 );
  foreach( $rows as $row ){
    $competition = getCompetition ( $row['competitionId'] );
    $competitionName = $competition['cellName'];
    tableCaption( false, competitionLink ( $row['competitionId'], $competitionName ) );
    tableHeader( explode( '|', "Person|Event|Round|Result Details" ),
                 array( 3 => 'class="f"' ));
    foreach( array('A','B') as $letter ){
      $otherLetter = chr( 65+66-ord($letter) );
      $resultStr = '';
      for ( $i = 1; $i <= 5; $i++ ) {
          $value = $row['value'.$i.$letter];
          if ( !$value ) break;
          $resultStr .= "<span class='label label-".( $value == $row['value'.$i.$otherLetter] ? "danger" : "success" )."'>".formatValue( $value, valueFormat( $row['eventId'.$letter] ) ) . "</span> ";
      }
      tableRow(
        array(
          personLink( $row['personId'.$letter], $row['personName'.$letter] ),
          eventCellName( $row['eventId'.$letter] ),
          roundCellName( $row['roundId'.$letter] ),
          $resultStr
        )
      );
    }
  }
  tableEnd();

  #--- Tell the result.
  $date = wcaDate();
  noticeBox2(
    count( $rows ) == 0,
    "No similar results were found.<br />$date",
    "Similar results were found.<br />$date"
  );
}

?>
