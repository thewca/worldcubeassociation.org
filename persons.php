<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'persons';
require( 'includes/_header.php' );

analyzeChoices();
offerChoices();
showMatchingPersons();

require( 'includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenRegionId, $chosenPatternHtml, $chosenPatternMysql;
  global $wcadb_conn;

  $chosenEventId      = getNormalParam( 'eventId' );
  $chosenRegionId     = getNormalParam( 'regionId' );
  $chosenPatternHtml  = getHtmlParam( 'pattern' );
  $chosenPatternMysql = getMysqlParam( 'pattern' );

  $pattern = getRawParamThisShouldBeAnException('pattern');
  if(preg_match('/(19|20)\d{2}[A-Z]{4}\d{2}/i', $pattern)) {
    $matches = $wcadb_conn->boundQuery('SELECT id FROM Persons WHERE id = ?', array('s', &$pattern));
    if(!empty($matches)) {
      header('Location: p.php?i='.$chosenPatternMysql);
      print '<a href="p.php?i='.$chosenPatternMysql.'"></a>';
      die();
    }
  }

}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenPatternHtml;

  displayChoices( array(
    eventChoice( false ),
    regionChoice( false ),
    textFieldChoice( 'pattern', 'Name, parts, or WCA id', $chosenPatternHtml ),
    choiceButton( true, 'search', 'Search' )
  ));

}

#----------------------------------------------------------------------
function showMatchingPersons () {
#----------------------------------------------------------------------
  global $chosenPatternHtml, $chosenPatternMysql, $chosenEventId, $chosenRegionId;

  #--- If nothing chosen yet, display a help message.
  if( ! $chosenPatternHtml  &&  ! $chosenEventId  &&  ! $chosenRegionId ){
    echo "<div style='width:85%; margin:auto; font-size:1.00em; font-weight:bold'><p>For the name field search, enter any name or name parts and don't worry about letter variations. For example, 'or joe' (enter without the quotes) will among others also find Jo&euml;l van Noort.</p></div>";
    return;
  }

  #--- Build the nameCondition (all searched parts must occur).
  $nameCondition = "";
  foreach( explode( ' ', $chosenPatternMysql ) as $namePart )
    $nameCondition .= " AND (person.name LIKE '%$namePart%' OR person.id LIKE '%$namePart%')";

  #--- Build the eventCondition (if any).
  if( $chosenEventId ){
    $eventConditionPart1 = ", (SELECT DISTINCT personId FROM ConciseSingleResults WHERE 1 " . eventCondition() . ") result";
    $eventConditionPart2 = "AND person.id = result.personId";
  }
  else {
    $eventConditionPart1 = "";
    $eventConditionPart2 = "";
  }
  
  #--- Do the query!
  $persons = dbQuery("
    SELECT DISTINCT person.id personId, person.name personName, country.name countryName
    FROM Persons person, Countries country $eventConditionPart1 
    WHERE " . randomDebug() . "
      $nameCondition
      " . regionCondition( '' ) . "
      AND country.id = person.countryId
      $eventConditionPart2
    ORDER BY personName, countryName, personId
  ");

  $count = count( $persons );
  $ext = ($count != 1) ? 's' : '';

  tableBegin( 'results', 3 );
  tableCaption( false, spaced( array(
    "$count person$ext matching:",
    eventName($chosenEventId),
    chosenRegionName( $chosenRegionId ),
    $chosenPatternHtml ? "\"$chosenPatternHtml\"" : ''
  )));
  tableHeader( explode( '|', 'Person|WCA id|Citizen of' ),
               array( 2 => 'class="f"' ));

  foreach( $persons as $person ){
    extract( $person );
    tableRow( array( personLink( $personId, $personName ), $personId, $countryName ));
  }

  tableEnd();
}

?>
