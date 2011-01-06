<?php

#----------------------------------------------------------------------
function specifyModel () {
#----------------------------------------------------------------------
  global $modelSpecs;
  
  $patternLink = "\[\{  [^}]+  }\{  (http:|mailto:)[^}]+  }]";
  $patternLinkList = "^($patternLink\s*)*$";
  $patternTextWithLinks = "^  [^{}]*  ($patternLink  [^{}]*)*  $";
    
#  echo preg_match( "/$patternLinkList/", 'xxx', $matches );
#  print_r( $matches );
#  echo $patternLinkList;
#[{ [^}]+ }{  (http:|mailto:) [^}]+ }]
  
  $modelSpecs = array (
    array (
      "line",
      "name",
      "Name",
      'The full name of the competition.',
      "European Rubik's Cube Championship 2006",
      "."
    ),
    array (
      "line",
      'cellName',
      'Nickname',
      'A short name for display inside lists, try to get close to 16 characters (including space characters).',
      "Europe 2006",
      "."
    ),
    array (
      'choice',
      'countryId',
      'Country',
      'The country where the competition takes place.',
      'France',
      '.',
      dbQuery( "SELECT id, name FROM Countries ORDER BY name" )
    ),
    array (
      "line",
      'cityName',
      'City name',
      'Name of the city where the competition takes place.',
      "[{Paris}{http://www.wikipedia.com/Paris}] TODO + SLASH?",
      "."
    ),
    array (
      "line",
      'venue',
      'Venue',
      'The venue where the competition takes place.',
      "[{Cité des Sciences et de l'Industrie}{http://www.cite-sciences.fr}]",
      $patternTextWithLinks
    ),
    array (
      "line",
      'venueAddress',
      'Venue address',
      "The address of the venue.",
      "30 avenue Corentin-Cariou, 75930 Paris",
      ""
    ),
    array (
      "line",
      'venueDetails',
      'Venue details',
      "Details about the venue.",
      "On the first floor far in the back, follow the signs.",
      ""
    ),
    array (
      "line",
      'year',
      'Year',
      'Year when the competition takes place (number with four digits).',
      "2006",
      '^\d{4}$'
    ),
    array (
      "line",
      'month',
      'Month',
      'What month does the competition start? (number in 1..12)',
      "9",
      '^([1-9]|1[0-2])$'
    ),
    array (
      "line",
      'day',
      'Day',
      'What day does the competition start? (number in 1..31)',
      "23",
      '^([1-9]|[1-3]\d)$'
    ),
    array (
      "line",
      'endMonth',
      'End-Month',
      'What month does the competition end? (number in 1..12)',
      "9",
      '^([1-9]|1[0-2])$'
    ),
    array (
      "line",
      'endDay',
      'End-Day',
      'What day does the competition end? (number in 1..31)',
      "24",
      '^([1-9]|[1-3]\d)$'
    ),
    array (
      "text",
      'information',
      'Information',
      'Some information text about the competition.',
      "Euro 2006 is open to citizens of the European countries and Israel. [{Euro 2006 registration page}{http://www.speedcubing.com/events/euro2006/registration.html}]",
      $patternTextWithLinks
    ),
    array (
      "text",
      'wcaDelegate',
      'WCA Delegate(s)',
      'List of the WCA delegate attending the competition.',
      "[{Ron van Bruchem}{mailto:rbruchem@worldcubeassociation.org}]<br />[{Gilles Roux}{mailto:grrroux@free.fr}]",
      $patternTextWithLinks
    ),
    array (
      "text",
      'organiser',
      'Organiser(s)',
      "List of the competition organizers.",
      "[{Euro2006 organisation team}{mailto:davidj@seventowns.com}]<br />[{Ron van Bruchem}{mailto:rbruchem@worldcubeassociation.org}]",
      $patternTextWithLinks
    ),
    array (
      "line",
      'website',
      'Website',
      'The website of the competition.',
      "[{Rubiks.com}{http://www.rubiks.com}]",
      $patternTextWithLinks
    )
  );
}

#----------------------------------------------------------------------
function checkData () {
#----------------------------------------------------------------------
  global $chosenSubmit;

  if( !$chosenSubmit )
    return;

  checkRegularFields();
  checkEventSpecifications();
}

#----------------------------------------------------------------------
function checkRegularFields () {
#----------------------------------------------------------------------
  global $modelSpecs, $data, $dataError;
  
  #--- Check the fields.
  foreach( $modelSpecs as $fieldSpec ){
  
    #--- Extract the field specification.
    list( $type, $id, $label, $description, $example, $pattern, $extra ) = $fieldSpec;

#    echo "$data[$id] vs $pattern\n";
        
    #--- Check the field.
    if( ! preg_match( "/$pattern/x", $data[$id] ))
      $dataError[$id] = true;
  }
}

#----------------------------------------------------------------------
function checkEventSpecifications () {
#----------------------------------------------------------------------
  global $data, $dataError;

  foreach( getAllEvents() as $event ){
    extract( $event );

    if( ! preg_match( "/^(|\d+)$/", $data["personLimit$id"] ))
      $dataError["event$id"] = true;

    if( ! preg_match( "/^(|\d+(:\d+|))$/", $data["timeLimit$id"] ))
      $dataError["event$id"] = true;
  }
}

#----------------------------------------------------------------------
function storeData () {
#----------------------------------------------------------------------
  global $data, $dataError, $dataSuccessfullySaved, $chosenSubmit;

  if( !$chosenSubmit )
    return;
  
  #--- Initially assume we'll fail.
  $dataSuccessfullySaved = false;
  
  #--- If errors were found, don't store and return.
  if( $dataError )
    return;

  #-- Building eventSpecs
  $eventSpecs = '';
  foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event ){
    extract($event);

    if ( $data["offer$id"] ){
/*      if ( preg_match( "/^(\d+):(\d+)$/", $data["timeLimit$id"], $matches ))
        $data["timeLimit$id"] = (int)$matches[1] * 60 + (int)$matches[2];*/

      $data["qualify$id"] = $data["qualify$id"] ? 1 : 0;

      if( $eventSpecs )
        $eventSpecs .= " $id=" . $data["personLimit$id"] . "/" . $data["timeLimit$id"] . "/" . $data["timeFormat$id"] . "/" . $data["qualify$id"] . "/" . $data["qualifyTimeLimit$id"];
      else
        $eventSpecs = "$id=" . $data["personLimit$id"] . "/" . $data["timeLimit$id"] . "/" . $data["timeFormat$id"] . "/" . $data["qualify$id"] . "/" . $data["qualifyTimeLimit$id"];
    }
  }

  #-- Building show*
  $data["showAtAll"] = $data["showAtAll"] ? 1 : 0;
  $data["showResults"] = $data["showResults"] ? 1 : 0;

  #--- Store data
  foreach( $data as $key => $value ) $data[$key] = mysql_real_escape_string( $value );
  extract($data);

  dbCommand("UPDATE Competitions
               SET name='$name',
                   cityName='$cityName',
                   countryId='$countryId',
                   information='$information',
                   year='$year',
                   month='$month',
                   day='$day',
                   endMonth='$endMonth',
                   endDay='$endDay',
                   eventSpecs='$eventSpecs',
                   wcaDelegate='$wcaDelegate',
                   organiser='$organiser',
                   venue='$venue',
                   venueAddress='$venueAddress',
                   venueDetails='$venueDetails',
                   website='$website',
                   cellName='$cellName',
                   showAtAll='$showAtAll',
                   showResults='$showResults'
                WHERE id='$competitionId'
  ");

  foreach( $data as $key => $value ) $data[$key] = stripslashes( $value );
 
  #--- Building the caches again
  require( '_helpers.php' );
  ob_start(); computeCachedDatabase( '../cachedDatabase.php' ); ob_end_clean();

  #--- Wow, we succeeded!
  $dataSuccessfullySaved = true;
}

?>
