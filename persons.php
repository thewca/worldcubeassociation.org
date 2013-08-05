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

  $chosenEventId      = getNormalParam( 'eventId' );
  $chosenRegionId     = getNormalParam( 'regionId' );
  $chosenPatternHtml  = getHtmlParam( 'pattern' );
  $chosenPatternMysql = getMysqlParam( 'pattern' );

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

  #--- The pattern should contain at least 2 non-whitespace characters.
  if(!preg_match('/\S.*\S/', $chosenPatternHtml)){
    noticeBox("Please Enter at least 2 characters.");
    echo "<div style='width:85%; margin:auto; font-size:1.00em; font-weight:bold'><p>For the name field search, enter any name or name parts and don't worry about letter variations. For example, 'or joe' (enter without the quotes) will among others also find Jo&euml;l van Noort.</p></div>";
    return;
  }

  #--- Otherwise, build up a query to search for people.
  global $wcadb_conn;
  $params = array(0 => '');
  $parts = array();
  $rawPattern = getRawParamThisShouldBeAnException('pattern');

  #--- Build the nameCondition (all searched parts must occur).
  $nameCondition = "";
  foreach(explode(' ', $rawPattern) as $namePart) {
    $parts[$namePart] = '%' . $namePart . '%';
    $nameCondition .= ' AND (person.name LIKE ? OR person.id LIKE ?)';
    $params[0] .= 'ss';
    $params[] = &$parts[$namePart];
    $params[] = &$parts[$namePart];
  }

  #--- Build the eventCondition (if any).
  if( $chosenEventId ){
    $eventConditionPart1 = ', (SELECT DISTINCT personId FROM ConciseSingleResults WHERE 1 ' . eventCondition() . ') result';
    $eventConditionPart2 = 'AND person.id = result.personId';
  }
  else {
    $eventConditionPart1 = '';
    $eventConditionPart2 = '';
  }
  
  #--- Do the query!
  $query = 'SELECT DISTINCT person.id AS personId, person.name AS personName, country.name AS countryName
            FROM Persons AS person, Countries AS country'
         . $eventConditionPart1 
         . ' WHERE ' . randomDebug()
         . $nameCondition
         . regionCondition('')
         . ' AND country.id = person.countryId'
         . $eventConditionPart2
         . ' ORDER BY personName, countryName, personId';
  $persons = $wcadb_conn->boundQuery($query, $params);


  $count = count($persons);
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
