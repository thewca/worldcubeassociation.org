<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
analyzeChoices();
adminHeadline( 'Check rounds/events' );
showDescription();
showChoices();

if( $chosenShow ) {
  checkRounds();
  checkEvents();
}

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p style='width:45em'>Check for rounds, to see if rules 9m and 9p about the number of rounds and the qualifications are followed.\n";

  echo "<p style='width:45em'>Check for events, to see if events registered for a competition are the same as events actually happened in the competition.\n";

  echo "<hr />\n";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenShow, $competitionCondition, $competitionDescription;

  $chosenCompetitionId  = getNormalParam( 'competitionId' );
  $chosenShow           = getBooleanParam( 'show' );

  $competitionCondition = competitionCondition();
  $competitionDescription = $chosenCompetitionId ? $chosenCompetitionId : "all competitions";
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------
  displayChoices( array(
    competitionChoice(),
    choiceButton( true, 'show', 'Show' )
  ));
}

#----------------------------------------------------------------------
function checkRounds () {
#----------------------------------------------------------------------
  global $competitionCondition, $competitionDescription;

  echo "<hr /><p>Checking <b> rounds for $competitionDescription</b>... (wait for the result message box at the end)</p>\n";

  #--- Get the number of competitors per round
  $roundRows = dbQuery("
    SELECT   count(result.id) nbPersons, result.competitionId, competition.year, competition.month, competition.day, result.eventId, result.roundId, round.cellName, result.formatId,
             CASE result.formatId WHEN '2' THEN BIT_AND( IF( result.value2,1,0)) WHEN '3' THEN BIT_AND( IF( result.value3,1,0)) WHEN 'm' THEN BIT_AND( IF( result.value3,1,0)) WHEN 'a' THEN BIT_AND( IF( result.value5 <> 0,1,0)) ELSE 1 END isNotCombined
    FROM     Results result, Competitions competition, Rounds round
    WHERE    competition.id = competitionId
      $competitionCondition
      AND    (( eventId <> '333mbf' ) OR (( competition.year = 2009 ) AND ( competition.month > 1 )) OR ( competition.year > 2009 ))
      AND    result.roundId <> 'b'
      AND    result.roundId = round.id
    GROUP BY competitionId, eventId, roundId
    ORDER BY year desc, month desc, day desc, competitionId, eventId, round.rank
  ");

  #--- Get the number of competitors per event
  $eventRows = dbQuery("
    SELECT   count(distinct result.personId) nbPersons, competitionId, eventId
    FROM     Results result, Competitions competition
    WHERE    competition.id = competitionId
      $competitionCondition
      AND    (( eventId <> '333mbf' ) OR (( competition.year = 2009 ) AND ( competition.month > 1 )) OR ( competition.year > 2009 ))
      AND    result.roundId <> 'b'
    GROUP BY competitionId, eventId
    ORDER BY year desc, month desc, day desc, competitionId, eventId
  ");

  #--- Begin the form
  echo "<form action='check_rounds_ACTION.php' method='post'>\n";

  $prevEvent = '';
  $wrongs = 0;
  foreach( $roundRows as $i => $roundRow ){
    list( $nbPersons, $competitionId, $year, $month, $day, $eventId, $roundId, $roundCellName, $formatId, $isNotCombined ) = $roundRow;
    $event = "$competitionId|$eventId";

    #--- First round
    if ( $event != $prevEvent ) {
      $nbRounds = 1;
      $eventRow = array_shift( $eventRows );
      list( $nbTotalPersons, $eventCompetitionId, $eventEventId ) = $eventRow;
      assert( $eventCompetitionId == $competitionId );
      assert( $eventEventId == $eventId );

      #--- Checks round names
      if( $prevEvent ){
        list( $prevCompetitionId, $prevEventId ) = explode('|', $prevEvent);
        $wrongs += checkRoundNames ( $roundInfos, $prevCompetitionId, $prevEventId );
      }

      $roundInfos = array();

      #--- Checks for qualification round
      $isThisRoundQuals = (( $roundId == '0' or $roundId == 'h' ));

      if (( $nbTotalPersons != $nbPersons ) and ( ! $isThisRoundQuals )) {
        echo "<p style='margin-top:2em; margin-bottom:0'><a href='/competitions/$competitionId/results/all#e{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";

        #--- Peek at next roundId
        if(( $i+1 ) < count( $roundRows )){ #--- Should be true.
          $nextRoundId = $roundRows[$i+1]['roundId'];
          showQualifications( $competitionId, $eventId, $roundId, $nextRoundId );
        }

        echo "<p>Not all persons that competed in $eventId are in $roundCellName. It should thus be indicated as Qualification round<p/>";
        addQuals( $competitionId, $eventId );
        echo "<br /><hr />";
        $isThisRoundQuals = true;
        $wrongs++;
      }

      if (( $nbTotalPersons == $nbPersons ) and ( $isThisRoundQuals )) {
        echo "<p style='margin-top:2em; margin-bottom:0'><a href='/competitions/$competitionId/results/all#e{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";

        #--- Peek at next roundId
        if(( $i+1 ) < count( $roundRows )) #--- Is not always true.
          if(( $roundRows[$i+1]['competitionId'] == $competitionId ) && ( $roundRows[$i+1]['eventId'] == $eventId )){ #--- Idem
            $nextRoundId = $roundRows[$i+1]['roundId'];
            showQualifications( $competitionId, $eventId, $roundId, $nextRoundId );
        }

        echo "<p>All persons that competed in $eventId are in $roundCellName. It should thus not be indicated as Qualification round</p>";
        removeQuals( $competitionId, $eventId );
        echo "<br /><hr />";
        $isThisRoundQuals = false;
        $wrongs++;
      }
    }

    # Following rounds
    else {
      $isThisRoundQuals = false;

      # Article 9m, since April 9, 2008
      if ( mktime( 0, 0, 0, $month, $day, $year ) >= mktime( 0, 0, 0, 4, 9, 2008 )) {
        if ((( $nbRounds > 1 ) and ( $nbTotalPersons < 8 )) or (( $nbRounds > 2 ) and ( $nbTotalPersons < 16 )) or (( $nbRounds > 3 ) and ( $nbTotalPersons < 100 )) or ( $nbRounds > 4 )) {
          echo "<p style='margin-top:2em; margin-bottom:0'><a href='/competitions/$competitionId/results/all#e{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";
          echo "<p>There are $nbRounds rounds for event $eventId, but only $nbTotalPersons competitors in total</p>";
          removeRound( $competitionId, $eventId, $nbRounds );
          echo "<br /><hr />";
          $wrongs++;
        }
      }

      # Article 9m/n/o, since July 20, 2006 until April 8, 2008
      if (( mktime( 0, 0, 0, $month, $day, $year ) >= mktime( 0, 0, 0, 7, 20, 2006 )) and ( mktime( 0, 0, 0, $month, $day, $year ) < mktime( 0, 0, 0, 4, 9, 2008 ))) {
        if ((( $nbRounds > 2 ) and ( $nbTotalPersons < 16 )) or (( $nbRounds > 3 ) and ( $nbTotalPersons < 100 )) or ( $nbRounds > 4 )) {
          echo "<p style='margin-top:2em; margin-bottom:0'><a href='/competitions/$competitionId/results/all#e{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";
          echo "<p>There are $nbRounds rounds for event $eventId, but only $nbTotalPersons competitors in total</p>";
          removeRound( $competitionId, $eventId, $nbRounds );
          echo "<br /><hr />";
          $wrongs++;
        }
      }

      $nbQualPersons = $isPrevRoundQuals ? getQualifications( $competitionId, $eventId, $prevRoundId, $roundId ) : $nbPersons;

      # Article 9p1, since April 14, 2010
      if ( mktime( 0, 0, 0, $month, $day, $year ) >= mktime( 0, 0, 0, 4, 14, 2010 )) {
        if ( $nbQualPersons > ( 3*$prevNbPersons/4 )) {
          echo "<p style='margin-top:2em; margin-bottom:0'><a href='/competitions/$competitionId/results/all#e{$eventId}_$roundId'>$competitionId - $eventId</a></p>";
          showQualifications( $competitionId, $eventId, $prevRoundId, $roundId );
          echo "<p>From round $prevRoundCellName with $prevNbPersons competitors, $nbQualPersons were qualified to round $roundCellName which is more than 75%</p>";
          echo "<br /><hr />";
          $wrongs++;
        }
      }

      # Article 9p, since July 20, 2006 until April 13, 2010
      if (( mktime( 0, 0, 0, $month, $day, $year ) >= mktime( 0, 0, 0, 7, 20, 2006 )) and ( mktime( 0, 0, 0, $month, $day, $year ) < mktime( 0, 0, 0, 4, 14, 2010 ))) {
        if ( $nbQualPersons >= $prevNbPersons ) {
          echo "<p style='margin-top:2em; margin-bottom:0'><a href='/competitions/$competitionId/results/all#e{$eventId}_$roundId'>$competitionId - $eventId</a></p>";
          showQualifications( $competitionId, $eventId, $prevRoundId, $roundId );
          echo "<p>From round $prevRoundCellName to round $roundCellName, at least one competitor must not proceed</p>";
          echo "<br /><hr />";
          $wrongs++;
        }
      }
    }
    $nbRounds += 1;
    $prevNbPersons = $nbPersons;
    $prevEvent = $event;
    $prevRoundId = $roundId;
    $prevRoundCellName = $roundCellName;
    $isPrevRoundQuals = $isThisRoundQuals;
    $roundInfos[] = array( $roundId, $roundCellName, $formatId, $isNotCombined );

  }

  #--- Tell the result.
  $date = wcaDate();
  noticeBox2(
    ! ( $wrongs ),
    "We didn't find any mistake.<br />$date",
    "<p>Darn! We disagree: $wrongs incorrect rounds found<br /><br />$date</p>"
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
function checkRoundNames ( $roundInfos, $competitionId, $eventId ) {
#----------------------------------------------------------------------

  #--- Whose rounds are combined
  $listCombined = array('h' => true, '0' => false, 'd' => true, '1' => false, '2' => false, 'e' => true, 'g' => true, '3' => false, 'c' => true, 'f' => false );
  #--- Switch between combined and not combined
  $switchCombined = array('h' => '0', '0' => 'h', 'd' => '1', '1' => 'd', '2' => 'e', 'e' => '2', 'g' => '3', '3' => 'g', 'c' => 'f', 'f' => 'c' );

  $normalRoundIds = array( 0 => array(), 1 => array( 'f' ), 2 => array( '1', 'f' ), 3 => array( '1', '2', 'f' ), 4 => array( '1', '2', '3', 'f' )); 

  $nbErrors = 0;
  $nbRounds = (( $roundInfos[0][0] == '0' ) or ( $roundInfos[0][0] == 'h' )) ? count( $roundInfos ) - 1 : count( $roundInfos );

  foreach( $roundInfos as $roundInfo ){

    list( $roundId, $roundCellName, $formatId, $isNotCombined ) = $roundInfo;
    $backRoundId = $roundId;

    #--- Check for round "combined-ness"
    if(( ! $isNotCombined ) xor $listCombined[$roundId] ){
      echo "<p style='margin-top:2em; margin-bottom:0'><a href='/competitions/$competitionId/results/all#e{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";
      echo "<p>Round $roundCellName should ". ( $isNotCombined?"not ":"" ) . "be a combined round</p>";
      $roundId = $switchCombined[$roundId];
      $nbErrors += 1;
    }

    if(( $backRoundId != '0' ) and ( $backRoundId != 'h' )){
      #--- Check for round name
      $normalRoundId = array_shift( $normalRoundIds[$nbRounds] );
      if(( $listCombined[$roundId]?$switchCombined[$roundId]:$roundId ) != $normalRoundId ){
        $roundId = $listCombined[$roundId]?$switchCombined[$normalRoundId]:$normalRoundId; 
        echo "<p style='margin-top:2em; margin-bottom:0'><a href='/competitions/$competitionId/results/all#e{$eventId}_$roundId'>$competitionId - $eventId - $backRoundId</a></p>";
        echo "<p>Round $roundCellName should be ". roundCellName( $roundId ) . "</p>";
        $nbErrors += 1;
      }
    }

    $translateRounds[$backRoundId] = $roundId;

  }

  if( $nbErrors )
    changeRounds( $competitionId, $eventId, $translateRounds, true );

  return $nbErrors;

}

#----------------------------------------------------------------------
function getQualifications ( $competitionId, $eventId, $roundId1, $roundId2 ) {
#----------------------------------------------------------------------
  global $competitionResults1, $competitionResults2, $personsBothRounds;

  #--- Get the results.
  $competitionResults1 = getCompetitionResults( $competitionId, $eventId, $roundId1 );
  $competitionResults2 = getCompetitionResults( $competitionId, $eventId, $roundId2 );

  #--- Intersection of the two rounds
  foreach( $competitionResults1 as $row )
    $personsRound1[] = $row['personId'];
  foreach( $competitionResults2 as $row )
    $personsRound2[] = $row['personId'];
  $personsBothRounds = array_intersect( $personsRound1, $personsRound2 );

  return( count( $personsBothRounds ));
}

#----------------------------------------------------------------------
function showQualifications ( $competitionId, $eventId, $roundId1, $roundId2 ) {
#----------------------------------------------------------------------
  global $competitionResults1, $competitionResults2, $personsBothRounds;

  getQualifications ( $competitionId, $eventId, $roundId1, $roundId2 );

  tableBegin( 'results', 8 );

  #--- Display competitors only in round 2
  foreach( $competitionResults2 as $key => $result ){

    if( in_array( $result['personId'], $personsBothRounds ))
      continue;

    extract( $result );

    #--- Header
    if( ! $captionShowed ){
      $anchors = "$eventId " . "${eventId}_$roundId";
      $eventHtml = eventLink( $eventId, $eventName );
      $caption = spaced( array( $eventHtml, $roundName, $formatName ));
      tableCaptionNew( false, $anchors, $caption );

      $headerAverage    = ($formatId == 'a'  ||  $formatId == 'm') ? 'Average' : '';
      $headerAllResults = ($formatId != '1') ? 'Result Details' : '';
      tableHeader( explode( '|', "Person|Place|Best|$headerAverage|Place|Best|$headerAverage|" ),
                 array( 1 => 'class="r"', 2 => 'class="R"', 3 => 'class="R"', 4 => 'class="r"', 5 => 'class="R"', 6 => 'class="R"', 7 => 'class="f"' ));

      $captionShowed = true;
    }

    #--- One result row.
    tableRow( array(
      personLink( $personId, $personName ),
      '',
      '',
      '',
      $pos,
      formatValue( $best, $valueFormat ),
      formatValue( $average, $valueFormat ),
      ''
    ));

    unset( $competitionResults2[$key] ); // Little speed-up for the second part
  }


  #--- Display the rest
  foreach( $competitionResults1 as $result ){
    extract( $result );

    $inRound2 = false;
    foreach ( $competitionResults2 as $key => $result2 )
      if( $result2['personId'] == $personId ) {
        extract( $result2, EXTR_PREFIX_ALL, 'r2' );
        unset( $competitionResults2[$key] );
        $inRound2 = true;
        $nbQuals += 1;
        break;
      }

    #--- Header
    if( ! $captionShowed ){
      $anchors = "$eventId " . "${eventId}_$roundId";
      $eventHtml = eventLink( $eventId, $eventName );
      $caption = spaced( array( $eventHtml, $roundName, $formatName ));
      tableCaptionNew( false, $anchors, $caption );

      $headerAverage    = ($formatId == 'a'  ||  $formatId == 'm') ? 'Average' : '';
      $headerAllResults = ($formatId != '1') ? 'Result Details' : '';
      tableHeader( explode( '|', "Person|Place|Best|$headerAverage|Place|Best|$headerAverage|" ),
                 array( 1 => 'class="r"', 2 => 'class="R"', 3 => 'class="R"', 4 => 'class="r"', 5 => 'class="R"', 6 => 'class="R"', 7 => 'class="f"' ));

      $captionShowed = true;
    }

    $offerToDelete = $inRound2&&((4*$nbQuals)>(3*count($competitionResults1)));

    #--- One result row.
    tableRow( array(
      personLink( $personId, $personName ),
      $pos,
      formatValue( $best, $valueFormat ),
      formatValue( $average, $valueFormat ),
      $inRound2?$r2_pos : "",
      $inRound2?formatValue( $r2_best, $r2_valueFormat ) : "",
      $inRound2?formatValue( $r2_average, $r2_valueFormat ) : "",
      $offerToDelete?"<input type='checkbox' name='deleteres$r2_id' value='1' /> Delete":""
    ));

  }


  tableEnd();
}

#----------------------------------------------------------------------
function addQuals ( $competitionId, $eventId ) {
#----------------------------------------------------------------------

  #--- Table of round translation
  $translateRounds = array( '1' => '0', 'd' => 'h', 'e' => 'd', '2' => '1', 'b' => 'b', '3' => '1', 'g' => 'e', 'c' => 'c', 'f' => 'f' );

  changeRounds( $competitionId, $eventId, $translateRounds, false );

}

#----------------------------------------------------------------------
function removeQuals ( $competitionId, $eventId ) {
#----------------------------------------------------------------------

  #--- Table of round translation
  $translateRounds = array( '0' => '1', 'h' => 'd', 'd' => 'e', '1' => '2', 'b' => 'b', '2' => '3', 'e' => 'g', '3' => '3', 'g' => 'g', 'c' => 'c', 'f' => 'f' );

  changeRounds( $competitionId, $eventId, $translateRounds, false );

}

#----------------------------------------------------------------------
function removeRound ( $competitionId, $eventId, $nbRounds ) {
#----------------------------------------------------------------------

  #--- Table of round translation
  if( $nbRounds == 2 )
    $translateRounds = array( '0' => '0', 'h' => 'h', 'd' => 'c', '1' => 'f', 'b' => 'b', '2' => 'f', 'e' => 'c', '3' => 'f', 'g' => 'c', 'c' => 'del', 'f' => 'del' );
  if( $nbRounds == 3 )
    $translateRounds = array( '0' => '0', 'h' => 'h', 'd' => 'd', '1' => '1', 'b' => 'b', '2' => 'f', 'e' => 'c', '3' => 'f', 'g' => 'c', 'c' => 'del', 'f' => 'del' );
  if( $nbRounds == 4 )
    $translateRounds = array( '0' => '0', 'h' => 'h', 'd' => 'd', '1' => '1', 'b' => 'b', '2' => '2', 'e' => 'e', '3' => 'f', 'g' => 'c', 'c' => 'del', 'f' => 'del' );

  changeRounds( $competitionId, $eventId, $translateRounds, false );

}


#----------------------------------------------------------------------
function changeRounds ( $competitionId, $eventId, $translateRounds, $checked ) {
#----------------------------------------------------------------------

  #--- Get rounds of the event
  $roundRows = dbQuery("
    SELECT   roundId, round.cellName
    FROM     Results result, Rounds round
    WHERE    result.competitionId = '$competitionId'
      AND    result.eventId = '$eventId'
      AND    result.roundId = round.id
      AND    result.roundId <> 'b'
    GROUP BY competitionId, eventId, roundId
    ORDER BY round.rank
  ");

  tableBegin( 'results', 3 );
  tableHeader( explode( '|', "Current round|New round|" ),
               array( 2 => 'class="f"' ));

  foreach( $roundRows as $roundRow ){
    extract( $roundRow );

    $formId = "setround$competitionId/$eventId/$roundId";
    tableRow( array( $cellName, listRounds( $translateRounds[$roundId], $formId), '' )); 

  }
  tableEnd();

  $checkbox = "<input type='checkbox' name='confirmround$competitionId/$eventId' value='1' " . ( $checked?"checked='checked'":"" ) . " />";
  echo "$checkbox Update<br/>";

}


#----------------------------------------------------------------------
function listRounds ( $selectedRoundId, $formId ) {
#----------------------------------------------------------------------

  $result = "<select class='drop' id='$formId' name='$formId'>\n";

  $selected = ($selectedRoundId == 'del') ? " selected='selected'" : "";
  $result .= "<option value='del'$selected>[delete]</option>\n";

  foreach( getAllRounds() as $round ){
    extract( $round );

    $selected = ($id == $selectedRoundId) ? " selected='selected'" : "";
    $result .= "<option value='$id'$selected>$cellName</option>\n";
  }

  $result .= "</select>";
  return $result;

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
function checkEvents () {
#----------------------------------------------------------------------
  global $competitionCondition, $competitionDescription;

  echo "<hr /><p>Checking <b> events for $competitionDescription</b>... (wait for the result message box at the end)</p>\n";

  #--- Get events from Results and Competitions
  $eventsResults = dbQuery( "SELECT r.competitionId, r.eventId, c.eventSpecs FROM Results r, Competitions c WHERE c.id = r.competitionId AND r.eventId != '333mbo' $competitionCondition GROUP BY r.competitionId, r.eventId" );

  # Grossness to handle the fact that the competition id in the Competitions table
  # is the "id" column, not the "competitionId" column.
  $competitionConditionForCompetitionsTable = str_replace("competitionId", "id", $competitionCondition);
  $eventsCompetition = dbQuery( "SELECT id, eventSpecs FROM Competitions WHERE 1 $competitionConditionForCompetitionsTable" );

  #--- Group events by competitions.
  foreach( $eventsResults as $eventResults ){
    extract( $eventResults );
    $arrayEventsResults[$competitionId][] = $eventId;
  }

  foreach( $eventsCompetition as $eventCompetition ){
    extract( $eventCompetition );
    $arrayEventsCompetition[$id] = getEventSpecsEventIds ( $eventSpecs );
  }

  $ok = true;
  #--- Compare events.
  if( $arrayEventsResults ) foreach( array_keys($arrayEventsResults) as $competitionId ){
    # Sort tables to compare them.
    sort($arrayEventsResults[$competitionId], SORT_STRING);
    sort($arrayEventsCompetition[$competitionId], SORT_STRING);

    if( $arrayEventsResults[$competitionId] != $arrayEventsCompetition[$competitionId] ){
      $ok = false;
      echo "<p>Update competition $competitionId.<br />\n";
      $intersect = array_intersect( $arrayEventsResults[$competitionId], $arrayEventsCompetition[$competitionId] );
      $resultsOnly = array_diff( $arrayEventsResults[$competitionId], $arrayEventsCompetition[$competitionId] );
      $competitionOnly = array_diff( $arrayEventsCompetition[$competitionId], $arrayEventsResults[$competitionId] );
      echo "  Old events list: ".implode(' ', $intersect)." <b style='color:#F00'>".implode(' ',$competitionOnly)."</b><br />\n";
      echo "  New events list: ".implode(' ', $intersect)." <b style='color:#3C3'>".implode(' ',$resultsOnly)."</b><br />\n";
      dbCommand( "UPDATE Competitions SET eventSpecs='".implode(' ', $arrayEventsResults[$competitionId])."' WHERE id='$competitionId'" );
    }
  }

  noticeBox2( $ok, 'No mistakes found in the database', 'Some errors were fixed, you *should* check what has been updated' );

}
?>
