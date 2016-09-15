<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'persons';

require( 'includes/_header.php' );

analyzeChoices();
showBody();

require( 'includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  $chosenPersonId = strtoupper( getNormalParam( 'personId' ) );
}

#----------------------------------------------------------------------
function showBody () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  // simple validation first...
  if(!preg_match('/\d{4}\w{4}\d{2}/', $chosenPersonId)) {
    showErrorMessage( 'Invalid WCA id Format <strong>[</strong>'.o($chosenPersonId).'<strong>]</strong>' );
    print '<p><a href="persons.php">Click here to search for people.</a></p>';
    return;
  }

  #--- Get all incarnations of the person.
  $persons = dbQuery("
    SELECT person.name personName, country.name countryName, day, month, year, gender
    FROM Persons person, Countries country
    WHERE person.id = '$chosenPersonId' AND country.id = person.countryId
    ORDER BY person.subId
  ");

  #--- If there are none, show an error and do no more.
  if( ! count( $persons )){
    showErrorMessage('Unknown person id <strong>[</strong>'.o($chosenPersonId).'<strong>]</strong>' );
    $namepart = substr($chosenPersonId, 4, 4);
    print '<p><a href="persons.php?pattern='.urlEncode($namepart).'">Click to search for people with `'.o($namepart).'` in their name.</a></p>';
    return;
  }

  #--- Get and show the current incarnation.
  $currentPerson = array_shift( $persons );
  extract( $currentPerson );
  echo "<h1>$personName</h1>";

  #--- Show previous incarnations if any.
  if( count( $persons )){
    echo "<p class='subtitle'>(previously ";
    foreach( $persons as $person )
      $previous[] = "$person[personName]/$person[countryName]";
    echo implode( ', ', $previous ) . ")</p>";
  }

  #--- Show the picture if any.
  $picture = getCurrentPictureFile($chosenPersonId);
  if( $picture )
    echo "<center><img class='person' src='$picture' /></center>";

  #--- Show the In Memoriam if any.
  $inMemoriamArray = array(
    "2008COUR01" => "https://www.worldcubeassociation.org/forum/viewtopic.php?t=2028",
    "2003LARS01" => "https://www.worldcubeassociation.org/forum/viewtopic.php?t=1982",
    "2012GALA02" => "https://www.worldcubeassociation.org/forum/viewtopic.php?t=1044",
    "2008LIMR01" => "https://www.worldcubeassociation.org/forum/viewtopic.php?t=945",
    "2008KIRC01" => "https://www.worldcubeassociation.org/forum/viewtopic.php?t=470",
  );
  if( array_key_exists($chosenPersonId, $inMemoriamArray) ){
    echo "<center><a target='_blank' href='$inMemoriamArray[$chosenPersonId]'>In Memoriam</a></center>";
  }

  #--- Show the details.
  tableBegin( 'results', 4 );
  tableCaption( false, 'Details' );
  tableHeader( explode( '|', 'Country|WCA Id|Gender|Competitions' ), array(3 => 'class="f"'));
  $gender_text = genderText($gender);
  $numberOfCompetitions = dbValue("SELECT count(distinct competitionId) FROM Results where personId='$chosenPersonId'");
  tableRow(array($countryName, $chosenPersonId, $gender_text, $numberOfCompetitions));
  tableEnd();

  #--- Try the cache for the results
  # tryCache( 'person', $chosenPersonId );

  #--- Now the results.
  require( 'includes/person_personal_records_current.php' );
  require( 'includes/person_world_championship_podiums.php' );
  require( 'includes/person_world_records_history.php' );
  require( 'includes/person_continent_records_history.php' );
  require( 'includes/person_events.php' );
}
