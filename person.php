<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'persons';

require( '_header.php' );

analyzeChoices();
showBody();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  $chosenPersonId = getNormalParam( 'personId' );
}

#----------------------------------------------------------------------
function showBody () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  #--- Get all incarnations of the person.
  $persons = dbQuery("
    SELECT person.name personName, country.name countryName
    FROM Persons person, Countries country
    WHERE person.id = '$chosenPersonId' AND country.id = person.countryId
    ORDER BY person.subId DESC
  ");

  #--- If there are none, show an error and do no more.
  if( ! count( $persons )){
    showErrorMessage( "Unknown person id <b>[</b>$chosenPersonId<b>]</b>" );
    return;
  }

  #--- Get and show the current incarnation.
  $currentPerson = array_shift( $persons );
  extract( $currentPerson );
  echo "<h1>$personName ($countryName)</h1>";
  echo "<p class='subtitle'>WCA ID : $chosenPersonId</p>";

  #--- Show previous incarnations if any.
  if( count( $persons )){
    echo "<p class='subtitle'>(previously ";
    foreach( $persons as $person )
      $previous[] = "$person[personName]/$person[countryName]";
    echo implode( ', ', $previous ) . ")</p>";
  }

  #--- Now the results.
  require( 'person_personal_records_current.php' );
  require( 'person_world_records_history.php' );
  require( 'person_continent_records_history.php' );
  require( 'person_events.php' );
}

?>
