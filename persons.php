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

  print '<div id="search-name" style="float: left;">';
  displayChoices( array(
    eventChoice( false ),
    regionChoice( false ),
    textFieldChoice( 'pattern', 'Name or name parts', $chosenPatternHtml ),
    choiceButton( true, 'search', 'Search' )
  ));
  print '</div>';


  print '<div id="search-wcaid" style="float: left;">';
  $form = new WCAClasses\FormBuilder("search-wcaid-submissions", array('method' => 'GET', 'action' => 'p.php', 'class' => 'choices_form'), FALSE);

  $search_field = new WCAClasses\FormBuilderEntities\Input("i", "");
  $search_field->label("Or go to WCA id");
  $form->addEntity($search_field);

  $submit_element = new WCAClasses\FormBuilderEntities\Input("submit", "submit");
  $submit_element->attribute("value", "Go");
  $submit_element->attribute("class", "chosenButton");
  $form->addEntity($submit_element);

  print $form->render();

  print '</div>';

  print '<br style="clear: both;" />';

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
    $nameCondition .= " AND person.name like '%$namePart%'";

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
