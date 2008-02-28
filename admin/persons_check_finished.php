<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
analyzeChoices();

showDescription();
#showChoices();
getPersonsFromPersons();
getPersonsFromResults();

checkSpacesInPersons();
checkSpacesInResults();
checkTooMuchInPersons();
checkTooMuchInResults();
checkDuplicatesInCompetition();
#checkPersonsInResultsWithoutIds();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>This script does *NOT* affect the database.</b></p>";

  echo "<p>In this script, a \"person\" always means a triple of id/name/countryId, and \"similar\" always means just name similarity.</p>";
  
  echo "<p>I run several phases, listed below. You should always work from top to bottom, i.e. don't work on one phase before all previous phases report \"OK\".";

  echo "<ul>";

  echo "<li><p>Find persons in <b>Persons</b> whose name starts or ends with space or has double spaces.</p></li>";

  echo "<li><p>Find persons in <b>Results</b> whose name starts or ends with space or has double spaces.</p></li>";
    
  echo "<li><p>Find persons in <b>Persons</b> who don't appear in <b>Results</b>. This should really never happen. I don't know what fix I could offer but I show you similar persons from <b>Results</b>.</p></li>";
  
  echo "<li><p>Find persons in <b>Results</b> who have ids but who don't appear in <b>Persons</b>. Can be caused by organizers telling you incorrect persons. I show similar persons from <b>Persons</b> and offer you to adopt their data. Can also be caused by a person really changing name or countryId, in this case please add this person to the <b>Persons</b> table with new subId.</p></li>";
  
  echo "<li>Find persons in <b>Results</b> that appear more than once in the same round, event and competition. This is the most easily detected case of where an organizer should've added numbers to otherwise equal persons but didn't. Or for example when like in CaltechWinter2007, the roundIds are wrong.";
  
  echo "</ul>";
  
  echo "<hr>";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  $chosenCompetitionId  = getNormalParam( 'competitionId' );
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    competitionChoice( true ),
    choiceButton( true, 'show', 'Show' )
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
  echo "<hr>";
  
  $bads = dbQuery("
    SELECT name FROM Persons
    WHERE name like ' %'
       OR name like '% '
       OR name like '%  %'
  ");
  
  #--- If all OK, say so and return.
  if( ! $bads ){
    echo "<p style='color:#6C6'><b>OK!</b> No person names in <b>Persons</b> start or end with a space or have double spaces.</p>";
    return;
  }
  echo "<p style='color:#F00'><b>BAD!</b> Some person names in <b>Persons</b> start or end with a space or have double spaces.</p>";
  
  tableBegin( 'results', 3 );
  tableHeader( split( '\\|', 'current|suggested|SQL' ), array( 2=>'class="f"' ));
  foreach( $bads as $bad ){
    extract( $bad );
    $goodPersonName = preg_replace( '/\s+/', ' ', trim( $name ));
    $regexForBad = preg_replace( '/\s+/', ' +', $name );
    $action = "UPDATE Persons SET name='$goodPersonName' WHERE name REGEXP '$regexForBad'";
    tableRow( array(
      visualize( $name ),
      visualize( $goodPersonName ),
      highlight( $action )
    ));
  }
  tableEnd();
}

#----------------------------------------------------------------------
function checkSpacesInResults () {
#----------------------------------------------------------------------
  echo "<hr>";
  
  $bads = dbQuery("
    SELECT personName FROM Results
    WHERE personName like ' %'
       OR personName like '% '
       OR personName like '%  %'
  ");
  
  #--- If all OK, say so and return.
  if( ! $bads ){
    echo "<p style='color:#6C6'><b>OK!</b> No person names in <b>Results</b> start or end with a space or have double spaces.</p>";
    return;
  }
  echo "<p style='color:#F00'><b>BAD!</b> Some person names in <b>Results</b> start or end with a space or have double spaces.</p>";
  
  tableBegin( 'results', 4 );
  tableHeader( split( '\\|', 'current|suggested|fix...|SQL' ), array( 3=>'class="f"' ));
  foreach( $bads as $bad ){
    extract( $bad );
    $goodPersonName = preg_replace( '/\s+/', ' ', trim( $personName ));
    $regexForBad = preg_replace( '/\s+/', ' +', $personName );
    $goodPersonName = mysqlEscape( $goodPersonName );
    $regexForBad = mysqlEscape( $regexForBad );
    $action = "UPDATE Results SET personName='$goodPersonName' WHERE personName REGEXP '$regexForBad'";
    tableRow( array(
      visualize( $personName ),
      visualize( $goodPersonName ),
      "<a href='_execute_sql_command.php?command=" . urlEncode($action) . "'>fix...</a>",
      ( $action ),
    ));
  }
  tableEnd();
}

#----------------------------------------------------------------------
function checkTooMuchInPersons () {
#----------------------------------------------------------------------
  global $personsFromPersons, $personsFromResults;
  echo "<hr>";
  
  #--- Find all that are too much.  
  foreach( array_keys( $personsFromPersons ) as $personKey ){
    if( ! $personsFromResults[$personKey] )
      $tooMuchInPersons[] = $personKey;
  }
  
  #--- If all OK, say so and return.
  if( ! $tooMuchInPersons ){
    echo "<p style='color:#6C6'><b>OK!</b> All persons in <b>Persons</b> also appear in <b>Results</b>.</p>";
    return;
  }
  echo "<p style='color:#F00'><b>BAD!</b> Not all persons in <b>Persons</b> also appear in <b>Results</b>:</p>";
  
  #--- Show the Persons troublemakers and possible matches in Results.     
  tableBegin( 'results', 4 );
  tableHeader( split( '\\|', 'source|name|countryId|id' ), array( 3=>'class="f"' ) );
  foreach( $tooMuchInPersons as $personKey ){
    extract( $personsFromPersons[$personKey] );
    tableRowStyled( 'font-weight:bold', array(
      'Persons',
      visualize( $name ),
      visualize( $countryId ),
      visualize( $id )
    ));
    foreach( getMostSimilarPersons( $name, $countryId, $personsFromResults ) as $similarPerson ){
      extract( $similarPerson );
      tableRow( visualize( array( 'Results', $name, $countryId, $id )));
    }
    tableRowEmpty();
  }
  tableEnd();
}

#----------------------------------------------------------------------
function checkTooMuchInResults () {
#----------------------------------------------------------------------
  global $personsFromPersons, $personsFromResults;
  echo "<hr>";
  
  #--- Find all that are too much.  
  foreach( array_keys( $personsFromResults ) as $personKey ){
    if( $personsFromResults[$personKey]['id']  &&  ! $personsFromPersons[$personKey] )
      $tooMuchInResults[] = $personKey;
  }
  
  #--- If all OK, say so and return.
  if( ! $tooMuchInResults ){
    echo "<p style='color:#6C6'><b>OK!</b> All persons in <b>Results</b> who have an id also appear in <b>Persons</b>.</p>";
    return;
  }
  echo "<p style='color:#F00'><b>BAD!</b> Not all persons in <b>Results</b> who have an id also appear in <b>Persons</b>:</p>";
  
  #--- Show the Results troublemakers and possible matches in Persons.     
  tableBegin( 'results', 5 );
  tableHeader( split( '\\|', 'source|name|countryId|id|SQL to adopt other person\'s data' ), array( 3=>'class="f"' ) );
  foreach( $tooMuchInResults as $personKey ){
    extract( $personsFromResults[$personKey] );
    tableRowStyled( 'font-weight:bold', array(
      'Results',
      visualize( $name ),
      visualize( $countryId ),
      visualize( $id ),
      ''
    ));
    $currId = $id;
    $currName = $name;
    $currCountryId = $countryId;
    foreach( getMostSimilarPersons( $name, $countryId, $personsFromPersons ) as $similarPerson ){
      extract( $similarPerson );
      $action = "UPDATE Results SET personId='$id', personName='$name', countryId='$countryId' WHERE personId='$currId' AND personName='$currName' AND countryId='$currCountryId'";
      tableRow( array(
        'Persons',
        visualize( $name ),
        visualize( $countryId ),
        visualize( $id ),
        highlight( $action )
      ));
    }
    tableRowEmpty();
  }
  tableEnd();
}

#----------------------------------------------------------------------
function checkDuplicatesInCompetition () {
#----------------------------------------------------------------------
  echo "<hr>";
  
  $duplicates = dbQuery("
    SELECT *
    FROM
      (SELECT personId, personName, countryId, competitionId, eventId, roundId, count(*) occurances
        FROM Results
        GROUP BY personId, personName, countryId, competitionId, eventId, roundId) helper
    WHERE occurances > 1
  ");
  
  #--- If all OK, say so and return.
  if( ! $duplicates ){
    echo "<p style='color:#6C6'><b>OK!</b> There are no personId/personName/countryId/competitionId/eventId/roundIdAll duplicates in <b>Results</b>.</p>";
    return;
  }
  echo "<p style='color:#F00'><b>BAD!</b> There are personId/personName/countryId/competitionId/eventId/roundIdAll duplicates in <b>Results</b>.</p>";

  tableBegin( 'results', 7 );
  tableHeader( split( '\\|', 'personId|personName|countryId|competitionId|eventId|roundId|#Occurances' ),
               array( 6=>'class="f"' ));
  foreach( $duplicates as $duplicate ){
    extract( $duplicate );
    tableRow( visualize( array(
      $personId, $personName, $countryId, $competitionId, $eventId, $roundId, $occurances
    )));
  }
  tableEnd();
}

#----------------------------------------------------------------------
function checkPersonsInResultsWithoutIds () {
#----------------------------------------------------------------------
  global $personsFromPersons, $personsFromResults;
  echo "<hr>";

#  global $chosenCompetitionId;
#  if( ! $chosenCompetitionId )
#    return;

  tableBegin( 'results', 6 );
  tableHeader( split( '\\|', '|personName|countryId|personId||' ), array( 5=>'class="f"' ) );

  foreach( $personsFromResults as $person ){
    extract( $person );
    if( $id )
      continue;
      
    #--- Show the new person.
    $idPrefix = strtoupper( substr( preg_replace( '/(.*)\s(.*)/', '$2$1', $name ), 0, 4 ));
    tableRowStyled( 'font-weight:bold', array(
      "<input type='radio' name='$name/$countryId' />",
      visualize( $name ),
      visualize( $countryId ),
      "$firstYear<input type='text' value='$idPrefix' size='5' maxlength='4' />??",
      '',
      ''
    ));
    
    $similarsCtr = 0;
    foreach( getMostSimilarPersonsMax( $name, $countryId, $personsFromResults, 10 ) as $similarPerson ){
      extract( $similarPerson, EXTR_PREFIX_ALL, 'other' );
      $checked = ($other_name==$name && $other_countryId==$countryId)
        ? "checked='checked'" : '';
      if( $checked && !$other_id )
        continue;
      tableRow( array(
        "<input type='radio' name='$name/$countryId' $checked />",
#        ($other_id ? personLink( $other_id, $other_name ) : $other_name),
        visualize( $other_name ),
        visualize( $other_countryId ),
        visualize( $other_id ),
        '', #sprintf( "%.2f", $similarity ),
        ''
      ));
      if( ++$similarsCtr == 4 )
        break;
    }
    tableRowEmpty();
    if( ++$ctr == 20 )
      break;
  }

  tableEnd();  
}

#----------------------------------------------------------------------
function getMostSimilarPersons ( $name, $countryId, $persons ) {
#----------------------------------------------------------------------
  return getMostSimilarPersonsMax( $name, $countryId, $persons, 4 );
}

#----------------------------------------------------------------------
function getMostSimilarPersonsMax ( $name, $countryId, $persons, $max ) {
#----------------------------------------------------------------------
  
  #--- Compute similarities to all persons.
  foreach( $persons as $other ) {
    extract( $other, EXTR_PREFIX_ALL, 'other' );
    similar_text( $name, $other_name, $similarity );
    $other['similarity'] = $similarity;
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

  if( $a['similarity'] > $b['similarity'] ) return -1;
  if( $a['similarity'] < $b['similarity'] ) return 1;
  
  if( $a['countrySimilarity'] > $b['countrySimilarity'] ) return -1;
  if( $a['countrySimilarity'] < $b['countrySimilarity'] ) return 1;
  
  if( $a['countryId'] ) return -1;
  
  return 0;
}

#----------------------------------------------------------------------
function visualize ( $text ) {
#----------------------------------------------------------------------

  return preg_replace( '/\s/', '<span style="color:#F00">#</span>', $text );
}

#----------------------------------------------------------------------
function highlight ( $sql ) {
#----------------------------------------------------------------------
  $sql = preg_replace( '/(UPDATE|SET|WHERE|AND|REGEXP)/', '<b>$1</b>', $sql );
  $sql = preg_replace( '/(\\w+)=\'(.*?)\'/', '<span style="color:#00C">$1</span>=\'<span style="color:#F00">$2</span>\'', $sql );
  return $sql;
}

?>
