<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
analyzeChoices();
adminHeadline( 'Check results' );
showDescription();
showChoices();

if ( $chosenCheckRecentIndividually || $chosenCheckRecentRelatively || $chosenCheckRecentRounds )
  $dateCondition = "AND (year*10000+month*100+day >= CURDATE() - INTERVAL 3 MONTH)";

if( $chosenCheckRecentIndividually || $chosenCheckAllIndividually )
  checkIndividually();
if( $chosenCheckRecentRelatively || $chosenCheckAllRelatively )
  checkRelatively();
if( $chosenCheckRecentRounds || $chosenCheckAllRounds )
  checkRounds();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p style='width:45em'>First, check the results individually, according to our <a href='check_results.txt'>checking procedure</a> (mostly that value1-value5 make sense and that average and best are correct).</p>\n";

  echo "<p style='width:45em'>Then, once they're correct individually, check them relatively. This compares results with others in the same round to check each competitor's place. Differences between calculated and stored places can be agreed to and then executed on the bottom of the page.\n";

  echo "<p style='width:45em'>You can also check rounds, to see if rules 9m and 9p about the number of rounds and the qualifications are followed.\n";

  echo "<p style='width:45em'>Usually you should check only the recent results (past three months), it's faster and it hides exceptions that shall remain (once they're older than three months).</p>\n";

  echo "<hr />\n";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCheckRecentIndividually, $chosenCheckAllIndividually, $chosenCheckRecentRelatively, $chosenCheckAllRelatively, $chosenCheckRecentRounds, $chosenCheckAllRounds;

  $chosenCheckRecentIndividually = getBooleanParam( 'checkRecentIndividually' );
  $chosenCheckAllIndividually    = getBooleanParam( 'checkAllIndividually' );
  $chosenCheckRecentRelatively   = getBooleanParam( 'checkRecentRelatively' );
  $chosenCheckAllRelatively      = getBooleanParam( 'checkAllRelatively' );
  $chosenCheckRecentRounds       = getBooleanParam( 'checkRecentRounds' );
  $chosenCheckAllRounds          = getBooleanParam( 'checkAllRounds' );
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    'Check individually:<br />&nbsp;',
    choiceButton( true, 'checkRecentIndividually', ' recent ' ),
    choiceButton( true, 'checkAllIndividually', ' all ' ),
    'Check relatively:<br />&nbsp;',
    choiceButton( true, 'checkRecentRelatively', ' recent ' ),
    choiceButton( true, 'checkAllRelatively', ' all ' ),
    'Check rounds:<br />&nbsp;',
    choiceButton( true, 'checkRecentRounds', ' recent ' ),
    choiceButton( true, 'checkAllRounds', ' all ' ),
  ));
}

#----------------------------------------------------------------------
function checkIndividually () {
#----------------------------------------------------------------------
  global $dateCondition, $chosenCheckAllIndividually, $competitionIds, $countryIds;

  echo "<hr /><p>Checking <b>" . ($chosenCheckAllIndividually ? 'all' : 'recent') . "</b> results <b>individually</b>... (wait for the result message box at the end)</p>\n";

  #--- Get all results (id, values, format, round).
  $dbResult = mysql_query("
    SELECT
      result.id, formatId, roundId, personId, competitionId, eventId, result.countryId,
      value1, value2, value3, value4, value5, best, average
    FROM Results result, Competitions competition
    WHERE competition.id = competitionId
      $dateCondition
    ORDER BY formatId, competitionId, eventId, roundId, result.id
  ")
    or die("<p>Unable to perform database query.<br/>\n(" . mysql_error() . ")</p>\n");

  #--- Build Id arrays
  $countryIds = array_flip( getAllIDs( dbQuery( "SELECT id FROM Countries" )));
  $competitionIds = array_flip( getAllIDs( getAllCompetitions()));

  #--- Process the results.
  $badIds = array();
  echo "<pre>\n";
  while( $result = mysql_fetch_array( $dbResult )){
    if( $error = checkResult( $result )){
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
function checkResult ( $result ) {
#----------------------------------------------------------------------
  global $competitionIds, $countryIds;

  $format = $result['formatId'];

  #--- 1) Let dns, dnf, zer, suc be the number of values of each kind.
  foreach( range( 1, 5 ) as $i ){
    $value = $result["value$i"];
    $dns += $value == -2;
    $dnf += $value == -1;
    $zer += $value == 0;
    $suc += $value > 0;
  }

  #--- 2) Check that no zero-value is followed by a non-zero value.
  foreach( range( 1, 4 ) as $i )
    if( $result["value$i"] == 0  &&  $result["value".($i+1)] != 0 )
      return "Zero must not be followed by non-zero.";

  #--- 3) Check zer<5 (there must be at least one non-zero value)
  if( $zer == 5 )
    return "There must be at least one non-zero value";

  #--- 4) Check dns+dnf+zer+suc=5 (nothing besides these is allowed)
  if( $dns + $dnf + $zer + $suc != 5 )
    return "Invalid value";

  #--- 5) Sort the successful values into v_1 .. v_suc
  $v = array();
  foreach( range( 1, 5 ) as $i ){
    $value = $result["value$i"];
    if( $value > 0 )
      $v[] = $value;
  }
  sort( $v );
  array_unshift( $v, 0 );

  #--- 6) compute best
  $best = ($suc > 0) ? $v[1] : (($dnf > 0) ? -1 : -2);

  #--- 7) compute average
  $average = 0;
  if( $format == 'm'   ) $average = ($zer > 2) ? 0 : (($suc < 3) ? -1 : round(($v[1] + $v[2] + $v[3]) / 3));
  if( $format == 'a'   ) $average = ($zer > 0) ? 0 : (($suc < 4) ? -1 : round(($v[2] + $v[3] + $v[4]) / 3));
  if( $average > 60000 ) $average = ($average + 50 - (($average + 50) % 100));

  #--- 8) compare the computed best and average with the stored ones
  if( $result['best']    != $best    ) return    "'best' should be $best";
  if( $result['average'] != $average ) return "'average' should be $average";

  #--- 9) check number of zero-values for non-combined rounds
  $round = $result['roundId'];
  if( $round != 'c'  &&  $round != 'd'  &&  $round != 'e'  &&  $round != 'g' && $round != 'h' ){
    if( $format == '1'  &&  $zer != 4 ) return "should have one non-zero value";
    if( $format == '2'  &&  $zer != 3 ) return "should have two non-zero values";
    if( $format == '3'  &&  $zer != 2 ) return "should have three non-zero values";
    if( $format == 'm'  &&  $zer != 2 ) return "should have three non-zero values";
    if( $format == 'a'  &&  $zer != 0 ) return "shouldn't have zero-values";
  }
  #--- 10) same for combined rounds
  else {
    if( $format == '2'  &&  $zer < 3 ) return "should have at most two non-zero values";
    if( $format == '3'  &&  $zer < 2 ) return "should have at most three non-zero values";
    if( $format == 'm'  &&  $zer < 2 ) return "should have at most three non-zero values";
  }

  #--- 11) check times over 10 minutes
  if( valueFormat( $result['eventId'] ) == 'time' )
    foreach( range( 1, 5 ) as $i ){
      $value = $result["value$i"];
      if(( $value > 60000 ) && ( $value % 100 ))
        return "$value should be rounded";
  }


  #--- 12) check for existing countryId
  if( ! isset( $countryIds[$result['countryId']] ))
    return "unknown country " . $result['countryId'];

  #--- 13) check for existing competitionId
  if( ! isset( $competitionIds[$result['competitionId']] ))
    return "unknown competition " . $result['competitionId'];

  #--- 14) check correctness of multi results according to H1b and H1c
  if( $result['eventId'] == '333mbf' ){
    foreach( range( 1, 5 ) as $i ){
      $value = $result["value$i"];
      if( $value < 1 )
        continue;
      $missed     = $value % 100; $value = intval( $value / 100 );
      $time       = $value % 100000; $value = intval( $value / 100000 );
      $difference = 99 - $value % 100;
      $solved     = $difference + $missed;
      $attempted  = $solved + $missed;

      if( $time > 3600 )
        return  formatValue( $result["value$i"], 'multi') . " should be below one hour";
      if( $time > ( 600 * $attempted ))
        return  formatValue( $result["value$i"], 'multi') . " should be below 10 minutes times the number of cubes";
    }
  }

}

#----------------------------------------------------------------------
function checkRelatively () {
#----------------------------------------------------------------------
  global $dateCondition, $chosenCheckAllRelatively;

  echo "<hr /><p>Checking <b>" . ($chosenCheckAllRelatively ? 'all' : 'recent') . "</b> results <b>relatively</b>... (wait for the result message box at the end)</p>\n";

  #--- Get all results (except the trick-duplicated (old) multiblind)
  $rows = dbQueryHandle("
    SELECT   result.id, competitionId, eventId, roundId, average, best, pos, personName
    FROM     Results result, Competitions competition
    WHERE    competition.id = competitionId
      $dateCondition
      AND    (( eventId <> '333mbf' ) OR (( competition.year = 2009 ) AND ( competition.month > 1 )) OR ( competition.year > 2009 ))
    ORDER BY year desc, month desc, day desc, competitionId, eventId, roundId, if(average>0, average, 2147483647), if(best>0, best, 2147483647), pos
  ");

  #--- Begin the form
  echo "<form action='check_results_ACTION.php' method='post'>\n";

  #--- Check the pos values
  while( $row = mysql_fetch_row( $rows ) ) {
    list( $resultId, $competitionId, $eventId, $roundId, $average, $best, $storedPos, $personName ) = $row;
    $round = "$competitionId|$eventId|$roundId";
    $result = "$average|$best";
    if ( $round != $prevRound )
      $ctr = $calcedPos = 1;
    if ( $ctr > 1  &&  $result != $prevResult )
      $calcedPos = $ctr;
    if ( $storedPos != $calcedPos ) {

      #--- Before the first difference in a round, show the round's full results
      if ( $round != $shownRound ) {
        $wrongRounds++;
        $wrongComp[$competitionId] = true;
        echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";
        showCompetitionResults( $competitionId, $eventId, $roundId );
        $shownRound = $round;
      }

      #--- Show each difference, with a checkbox to agree
      $change = $calcedPos-$storedPos; if( $change>0 ) $change = "+$change";
      $checkbox = "<input type='checkbox' name='setpos$resultId' value='$calcedPos' />";
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
function checkRounds () {
#----------------------------------------------------------------------
  global $dateCondition, $chosenCheckAllRounds;

  echo "<hr /><p>Checking <b>" . ($chosenCheckAllRounds ? 'all' : 'recent') . " rounds</b>... (wait for the result message box at the end)</p>\n";

  #--- Get the number of competitors per round
  $roundRows = dbQuery("
    SELECT   count(result.id) nbPersons, result.competitionId, competition.year, competition.month, competition.day, result.eventId, result.roundId, round.cellName, result.formatId,
             CASE result.formatId WHEN '2' THEN BIT_AND( IF( result.value2,1,0)) WHEN '3' THEN BIT_AND( IF( result.value3,1,0)) WHEN 'm' THEN BIT_AND( IF( result.value3,1,0)) WHEN 'a' THEN BIT_AND( IF( result.value5 <> 0,1,0)) ELSE 1 END isNotCombined
    FROM     Results result, Competitions competition, Rounds round
    WHERE    competition.id = competitionId
      $dateCondition
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
      $dateCondition
      AND    (( eventId <> '333mbf' ) OR (( competition.year = 2009 ) AND ( competition.month > 1 )) OR ( competition.year > 2009 ))
      AND    result.roundId <> 'b'
    GROUP BY competitionId, eventId
    ORDER BY year desc, month desc, day desc, competitionId, eventId
  ");

  #--- Begin the form
  echo "<form action='check_results_ACTION.php' method='post'>\n";

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
        echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";

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
        echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";

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
      if ( mktime( 0, 0, 0, $month, $day, $year ) >= mktime( 0, 0, 0, 4, 9, 2008 ))
        if ((( $nbRounds > 1 ) and ( $nbTotalPersons < 8 )) or (( $nbRounds > 2 ) and ( $nbTotalPersons < 16 )) or (( $nbRounds > 3 ) and ( $nbTotalPersons < 100 )) or ( $nbRounds > 4 )) {
          echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";
          echo "<p>There are $nbRounds rounds for event $eventId, but only $nbTotalPersons competitors in total</p>";
          echo "<br /><hr />";
          $wrongs++;
      }

      # Article 9m/n/o, since July 20, 2006 until April 8, 2008
      if (( mktime( 0, 0, 0, $month, $day, $year ) >= mktime( 0, 0, 0, 7, 20, 2006 )) and ( mktime( 0, 0, 0, $month, $day, $year ) < mktime( 0, 0, 0, 4, 9, 2008 )))
        if ((( $nbRounds > 2 ) and ( $nbTotalPersons < 16 )) or (( $nbRounds > 3 ) and ( $nbTotalPersons < 100 )) or ( $nbRounds > 4 )) {
          echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";
          echo "<p>There are $nbRounds rounds for event $eventId, but only $nbTotalPersons competitors in total</p>";
          echo "<br /><hr />";
          $wrongs++;
      }

      $nbQualPersons = $isPrevRoundQuals ? getQualifications( $competitionId, $eventId, $prevRoundId, $roundId ) : $nbPersons;

      # Article 9p1, since April 14, 2010
      if ( mktime( 0, 0, 0, $month, $day, $year ) >= mktime( 0, 0, 0, 4, 14, 2010 ))
        if ( $nbQualPersons > ( 3*$prevNbPersons/4 )) {
          echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}'>$competitionId - $eventId</a></p>";
          showQualifications( $competitionId, $eventId, $prevRoundId, $roundId );
          echo "<p>From round $prevRoundCellName with $prevNbPersons competitors, $nbQualPersons were qualified to round $roundCellName which is more than 75%</p>";
          echo "<br /><hr />";
          $wrongs++;
        }

      # Article 9p, since July 20, 2006 until April 13, 2010
      if (( mktime( 0, 0, 0, $month, $day, $year ) >= mktime( 0, 0, 0, 7, 20, 2006 )) and ( mktime( 0, 0, 0, $month, $day, $year ) < mktime( 0, 0, 0, 4, 14, 2010 )))
        if ( $nbQualPersons >= $prevNbPersons ) {
          echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}'>$competitionId - $eventId</a></p>";
          showQualifications( $competitionId, $eventId, $prevRoundId, $roundId );
          echo "<p>From round $prevRoundCellName to round $roundCellName, at least one competitor must not proceed</p>";
          echo "<br /><hr />";
          $wrongs++;
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
      echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}_$roundId'>$competitionId - $eventId - $roundId</a></p>";
      echo "<p>Round $roundCellName should ". ( $isNotCombined?"not ":"" ) . "be a combined round</p>";
      $roundId = $switchCombined[$roundId];
      $nbErrors += 1;
    }

    if(( $backRoundId != '0' ) and ( $backRoundId != 'h' )){
      #--- Check for round name
      $normalRoundId = array_shift( $normalRoundIds[$nbRounds] );
      if(( $listCombined[$roundId]?$switchCombined[$roundId]:$roundId ) != $normalRoundId ){
        $roundId = $listCombined[$roundId]?$switchCombined[$normalRoundId]:$normalRoundId; 
        echo "<p style='margin-top:2em; margin-bottom:0'><a href='http://worldcubeassociation.org/results/c.php?i=$competitionId&allResults=1#{$eventId}_$roundId'>$competitionId - $eventId - $backRoundId</a></p>";
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
      tableHeader( split( '\\|', "Person|Place|Best|$headerAverage|Place|Best|$headerAverage|" ),
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
      tableHeader( split( '\\|', "Person|Place|Best|$headerAverage|Place|Best|$headerAverage|" ),
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
  $translateRounds = array( 0 => 1, 'h' => 'd', 'd' => 'e', '1' => '2', 'b' => 'b', '2' => '3', 'e' => 'g', '3' => '3', 'g' => 'g', 'c' => 'c', 'f' => 'f' );

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
  tableHeader( split( '\\|', "Current round|New round|" ),
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
  foreach( getAllRounds() as $round ){
    extract( $round );

    $selected = ($id == $selectedRoundId) ? " selected='selected'" : "";
    $result .= "<option value='$id'$selected>$cellName</option>\n";
  }

  $result .= "</select>";
  return $result;

}




#----------------------------------------------------------------------
function showCompetitionResults ( $competitionId, $eventId, $roundId ) {
#----------------------------------------------------------------------

  # NOTE: This is mostly a copy of the same function in competition_results.php

  #--- Get the results.
  $competitionResults = getCompetitionResults( $competitionId, $eventId, $roundId );

  tableBegin( 'results', 8 );

  foreach( $competitionResults as $result ){
    extract( $result );

    $isNewEvent = ($eventId != $currentEventId);
    $isNewRound = ($roundId != $currentRoundId);

    #--- Welcome new rounds.
    if( $isNewEvent  ||  $isNewRound ){

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
      $pos,
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

?>
