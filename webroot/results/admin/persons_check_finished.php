<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
analyzeChoices();
adminHeadline( 'Check finished persons' );
showDescription();
showChoices();

if( $chosenCheck ){
  echo "<hr /><p>Checking... (wait for the result message box at the end)</p>\n";

  #--- Prepare the data
  getPersonsFromPersons();
  getPersonsFromResults();

  #--- Run the checks
  $success = true;
  checkSpacesInPersons();
  checkSpacesInResults();

  checkTooMuchInResults();
  checkDuplicatesInCompetition();

  #--- Tell the result
  noticeBox2(
    $success,
    "Finished. All checks successful.<br />" . wcaDate(),
    "Finished. Some errors found.<br />" . wcaDate()
  );
}

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>In this script, a \"person\" always means a triple of id/name/countryId, and \"similar\" always means just name similarity.</p>\n\n";
  
  echo "<p>I run several phases, listed below. You should always work from top to bottom, i.e. don't work on one phase before all previous phases report \"OK\".</p>\n\n";

  echo "<ul>\n";

  echo "<li><p>Find persons in <strong>Persons</strong> whose name starts or ends with space or has double spaces.</p></li>\n";

  echo "<li><p>Find persons in <strong>Results</strong> whose name starts or ends with space or has double spaces.</p></li>\n";

  echo "<li><p>Find persons in <strong>Results</strong> who have ids but who don't appear in <strong>Persons</strong>. Can be caused by organizers telling you incorrect persons. I show similar persons from <strong>Persons</strong> and offer you to adopt their data. Can also be caused by a person really changing name or countryId, in this case please add this person to the <strong>Persons</strong> table with new subId.</p></li>\n";
  
  echo "<li><p>Find persons in <strong>Results</strong> that appear more than once in the same round, event and competition. This is the most easily detected case of where an organizer should've added numbers to otherwise equal persons but didn't. Or for example when like in CaltechWinter2007, the roundTypeIds are wrong. <b>Warning:</b> Currently this is only checks the last three months, to prevent a timeout problem.</p></li>\n";
  
  echo "</ul>";
  
  echo "<hr />";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCheck;

  $chosenCheck = getNormalParam( 'check' );
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    choiceButton( true, 'check', ' Check now ' )
  ));
}

#----------------------------------------------------------------------
function getPersonsFromPersons () {
#----------------------------------------------------------------------
  global $personsFromPersons;
  
  $persons = dbQuery( "SELECT id, name, countryId FROM Persons" );
  foreach( $persons as $person ){
    extract( $person );
    $personsFromPersons["$id/$name/$countryId"] = $person;
  }
}

#----------------------------------------------------------------------
function getPersonsFromResults () {
#----------------------------------------------------------------------
  global $personsFromResults;
  
  $persons = dbQuery("
    SELECT personId id, personName name, result.countryId, min(year) firstYear
    FROM Results result, Competitions competition
    WHERE competition.id = competitionId
    GROUP BY BINARY personId, BINARY personName, BINARY result.countryId
  ");
  foreach( $persons as $person ){
    extract( $person );
    $personsFromResults["$id/$name/$countryId"] = $person;
  }
}

#----------------------------------------------------------------------
function checkSpacesInPersons () {
#----------------------------------------------------------------------
  echo "<hr />";
  
  $bads = dbQuery("
    SELECT name FROM Persons
    WHERE name like ' %'
       OR name like '% '
       OR name like '%  %'
  ");
  
  #--- If all OK, say so and return.
  if( ! $bads ){
    echo "<p style='color:#6C6'><strong>OK!</strong> No person names in <strong>Persons</strong> start or end with a space or have double spaces.</p>";
    return;
  }
  
  #--- Otherwise, show the errors
  echo "<p style='color:#F00'><strong>BAD!</strong> Some person names in <strong>Persons</strong> start or end with a space or have double spaces.</p>";
  tableBegin( 'results', 3 );
  tableHeader( explode( '|', '|Current|Suggested' ), array( 2=>'class="f"' ));
  foreach( $bads as $bad ){
    extract( $bad );
    $goodPersonName = preg_replace( '/\s+/', ' ', trim( $name ));
    $badPersonName = $name;
    tableRow( array(
      '<a href="persons_check_finished_ACTION.php?action=fix_person_name&old_name='.urlEncode($badPersonName).'&new_name='.urlEncode($goodPersonName).'">Change:</a>',
      visualize($name),
      visualize($goodPersonName),
    ));
  }
  tableEnd();
  $GLOBALS["success"] = false;
}

#----------------------------------------------------------------------
function checkSpacesInResults () {
#----------------------------------------------------------------------
  echo "<hr />";
  
  $bads = dbQuery("
    SELECT DISTINCT personName FROM Results
    WHERE personName like ' %'
       OR personName like '% '
       OR personName like '%  %'
  ");
  
  #--- If all OK, say so and return.
  if( ! $bads ){
    echo "<p style='color:#6C6'><strong>OK!</strong> No person names in <strong>Results</strong> start or end with a space or have double spaces.</p>";
    return;
  }

  #--- Otherwise, show the errors
  echo "<p style='color:#F00'><strong>BAD!</strong> Some person names in <strong>Results</strong> start or end with a space or have double spaces.</p>";
  tableBegin( 'results', 3 );
  tableHeader( explode( '|', '|Current|Suggested' ), array( 2=>'class="f"' ));
  foreach( $bads as $bad ){
    extract( $bad );
    $goodPersonName = preg_replace( '/\s+/', ' ', trim( $personName ));
    $badPersonName = $personName;
    $action = "UPDATE Results SET personName=\"$goodPersonName\" WHERE personName=\"$badPersonName\"";
    tableRow( array(
      '<a href="persons_check_finished_ACTION.php?action=fix_results_name&old_name='.urlEncode($badPersonName).'&new_name='.urlEncode($goodPersonName).'">Change:</a>',
      visualize( $personName ),
      visualize( $goodPersonName ),
    ));
  }
  tableEnd();
  $GLOBALS["success"] = false;
}


#----------------------------------------------------------------------
function checkTooMuchInResults () {
#----------------------------------------------------------------------
  global $personsFromPersons, $personsFromResults;
  echo "<hr />";
  
  $tooMuchInResults = array();
  #--- Find all ('finished') entries in Results that don't have a match in Persons.
  foreach( array_keys( $personsFromResults ) as $personKey ){
    if( $personsFromResults[$personKey]['id']  &&  ! isset($personsFromPersons[$personKey]) )
      $tooMuchInResults[] = $personKey;
  }
  
  #--- If all OK, say so and return.
  if( empty($tooMuchInResults) ){
    echo "<p style='color:#6C6'><strong>OK!</strong> All persons in <strong>Results</strong> who have an id also appear in <strong>Persons</strong>.</p>";
    return;
  }
  
  #--- Otherwise, show the Results troublemakers and possible matches in Persons.
  echo "<p style='color:#F00'><strong>BAD!</strong> Not all persons in <strong>Results</strong> who have an id also appear in <strong>Persons</strong>:</p>";
  tableBegin( 'results', 4 );
  tableHeader( explode( '|', '|Name|countryId|id' ), array( 3=>'class="f"' ) );
  foreach( $tooMuchInResults as $personKey ){
    extract( $personsFromResults[$personKey] );
    tableRowStyled( 'font-weight:bold', array(
      '',
      visualize( $name ),
      visualize( $countryId ),
      visualize( $id ),
    ));
    $currId = $id;
    $currName = $name;
    $currCountryId = $countryId;
    foreach( getMostSimilarPersons( $id, $name, $countryId, $personsFromPersons ) as $similarPerson ){
      extract( $similarPerson );
      tableRow( array(
        '<a href="persons_check_finished_ACTION.php?action=fix_results_data'
          . '&old_name=' . urlEncode($currName)
          . '&new_name=' . urlEncode($name)
          . '&old_id=' . urlEncode($currId)
          . '&new_id=' . urlEncode($id)
          . '&old_country=' . urlEncode($currCountryId)
          . '&new_country=' . urlEncode($countryId)
          . '">Change to:</a>',
        visualize( $name ),
        visualize( $countryId ),
        visualize( $id ),
      ));
    }
    tableRowEmpty();
  }
  tableEnd();
  $GLOBALS["success"] = false;
}

#----------------------------------------------------------------------
function checkDuplicatesInCompetition () {
#----------------------------------------------------------------------
  echo "<hr />";

  # TODO: This is only to prevent the timeout problem and should eventually be properly handled again
  $dateCondition = "AND (year*10000+month*100+day >= CURDATE() - INTERVAL 3 MONTH)";

  $duplicates = dbQuery("
    SELECT personId, personName, Results.countryId, competitionId, eventId, roundTypeId, count(*) AS occurances
    FROM Results INNER JOIN Competitions WHERE Competitions.id = competitionId $dateCondition
    GROUP BY competitionId, personId, eventId, roundTypeId, personName, countryId
    HAVING occurances > 1
  ");
  
  #--- If all OK, say so and return.
  if( ! $duplicates ){
    echo "<p style='color:#6C6'><strong>OK!</strong> There are no personId/personName/countryId/competitionId/eventId/roundTypeIdAll duplicates in <strong>Results</strong>.</p>";
    return;
  }

  #--- Otherwise, show the errors
  echo "<p style='color:#F00'><strong>BAD!</strong> There are personId/personName/countryId/competitionId/eventId/roundTypeIdAll duplicates in <strong>Results</strong>.</p>";
  tableBegin( 'results', 7 );
  tableHeader( explode( '|', 'personId|personName|countryId|competitionId|eventId|roundTypeId|#Occurances' ),
               array( 6=>'class="f"' ));
  foreach( $duplicates as $duplicate ){
    extract( $duplicate );
    tableRow( visualize( array(
      $personId, $personName, $countryId, $competitionId, $eventId, $roundTypeId, $occurances
    )));
  }
  tableEnd();
  $GLOBALS["success"] = false;
}




#----------------------------------------------------------------------
function getMostSimilarPersons ( $id, $name, $countryId, $persons ) {
#----------------------------------------------------------------------
  return getMostSimilarPersonsMax( $id, $name, $countryId, $persons, 5 );
}

#----------------------------------------------------------------------
function getMostSimilarPersonsMax ( $id, $name, $countryId, $persons, $max ) {
#----------------------------------------------------------------------
  
  #--- Compute similarities to all persons.
  foreach( $persons as $other ) {
    extract( $other, EXTR_PREFIX_ALL, 'other' );
    $other['idSimilarity'] = ( $id == $other_id );
    similar_text( $name, $other_name, $similarity );
    $other['nameSimilarity'] = $similarity;
    similar_text( $countryId, $other_countryId, $similarity );
    $other['countrySimilarity'] = $similarity;
    $candidates[] = $other;
  }
  
  #--- Sort candidates and return up to three most promising.
  usort( $candidates, 'compareCandidates' );
  return array_slice( $candidates, 0, $max );
}

#----------------------------------------------------------------------
function compareCandidates ( $a, $b ) {
#----------------------------------------------------------------------
  if( $a['idSimilarity'] ) return -1;
  if( $b['idSimilarity'] ) return 1;
  
  if( $a['nameSimilarity'] > $b['nameSimilarity'] ) return -1;
  if( $a['nameSimilarity'] < $b['nameSimilarity'] ) return 1;
  
  if( $a['countrySimilarity'] > $b['countrySimilarity'] ) return -1;
  if( $a['countrySimilarity'] < $b['countrySimilarity'] ) return 1;
  
  if( $a['countryId'] ) return -1;
  
  return 0;
}
