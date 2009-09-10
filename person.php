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
    SELECT person.name personName, country.name countryName, day, month, year, gender
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
  echo "<h1><a href='person_set.php?personId=$chosenPersonId'>$personName</a></h1>";
  //echo "<p class='subtitle'>WCA ID : $chosenPersonId</p>";

  #--- Show previous incarnations if any.
  if( count( $persons )){
    echo "<p class='subtitle'>(previously ";
    foreach( $persons as $person )
      $previous[] = "$person[personName]/$person[countryName]";
    echo implode( ', ', $previous ) . ")</p>";
  }

  #--- Show the picture if any.
  $picture_jpg = 'upload/a' . $chosenPersonId . '.jpg';
  $picture_png = 'upload/a' . $chosenPersonId . '.png';
  $picture_gif = 'upload/a' . $chosenPersonId . '.gif';
  foreach( array( $picture_jpg, $picture_png, $picture_gif ) as $picture )
    if( is_file( $picture ))
      echo "<center><img width='200' height='300' src='$picture' /></center>";


  #--- Show the details.
  tableBegin( 'results', 4 );
  tableCaption( false, 'Details' );
  tableHeader( split( '\\|', 'Country|WCA Id|Date of birth|Gender' ), array(3 => 'class="f"'));

  if( $year > 0 ){
    $months = split( " ", ". Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec" );
    $dob = "$months[$month] $day, $year";
  }
  //tableRow( array( $countryName, $chosenPersonId, $dob, $gender == 'm' ? 'Male' : ( $gender == 'f' ? 'Female' : '' )));
  tableRow( array( $countryName, $chosenPersonId, '', $gender == 'm' ? 'Male' : ( $gender == 'f' ? 'Female' : '' )));
  tableEnd();


  #--- Now the results.
  require( 'person_personal_records_current.php' );
  require( 'person_world_records_history.php' );
  require( 'person_continent_records_history.php' );
  require( 'person_events.php' );
}

?>
