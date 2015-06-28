<?php

$currentSection = "persons";
$mapsAPI = true;
require_once( 'includes/_framework.php' );

$chosenPersonId = getNormalParam( 'i' );

$chosenCompetitions = dbQuery("
  SELECT 
    competition.*
  FROM
    Results result,
    Competitions competition
  WHERE 1
    AND result.personId='$chosenPersonId'
    AND competition.id = result.competitionId
  GROUP BY
    competition.id
  ORDER BY
    latitude, longitude, year, month, day");

require( 'includes/_header.php' );

// simple validation first...
if(!preg_match('/\d{4}\w{4}\d{2}/', $chosenPersonId)) {
  showErrorMessage( 'Invalid WCA id Format <strong>[</strong>'.o($chosenPersonId).'<strong>]</strong>' );
  print '<p><a href="persons.php">Click here to search for people.</a></p>';
  require( 'includes/_footer.php' );
  die();
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
  require( 'includes/_footer.php' );
  die();
}

#--- Get and show the current incarnation.
$currentPerson = array_shift( $persons );
echo "<h1>".o($currentPerson['personName'])." - Map of Competitions</h1>";
echo "<h2><a href='p.php?i=".urlEncode($chosenPersonId)."'>Back to Competitor Page</a></h2>";

// create map markers
$markers = array();
foreach($chosenCompetitions as $comp) {
  $markers[$comp['id']] = array();
  $markers[$comp['id']]['latitude'] = $comp['latitude'];
  $markers[$comp['id']]['longitude'] = $comp['longitude'];
  $markers[$comp['id']]['info'] = "<a href='c.php?i=".$comp['id']."'>" . o($comp['cellName']) . "</a><br />"
    . date("M j, Y", mktime(0,0,0,$comp['month'],$comp['day'],$comp['year']))
    . " - " . o($comp['cityName']);
}

displayMap($markers);

require( 'includes/_footer.php' );
