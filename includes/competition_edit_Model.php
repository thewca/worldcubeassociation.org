<?php

#----------------------------------------------------------------------
function specifyModel () {
#----------------------------------------------------------------------
  global $modelSpecs;
  
  $patternLink = "\[\{  [^}]+  }\{  (https?:|mailto:)[^}]+  }]";
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
      ".",
      NULL
    ),
    array (
      "line",
      'cellName',
      'Nickname',
      'A short name for display inside lists, try to get close to 16 characters.',
      "Europe 2006",
      ".",
      NULL
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
      "Paris",
      ".",
      NULL
    ),
    array (
      "line",
      'venue',
      'Venue',
      'The venue where the competition takes place.',
      "[{Cité des Sciences et de l'Industrie}{http://www.cite-sciences.fr}]",
      $patternTextWithLinks,
      NULL
    ),
    array (
      "line",
      'venueAddress',
      'Venue address',
      "The address of the venue.",
      "30 avenue Corentin-Cariou, 75930 Paris",
      "",
      NULL
    ),
    array (
      "line",
      'venueDetails',
      'Venue details',
      "Details about the venue.",
      "On the first floor far in the back, follow the signs.",
      "",
      NULL
    ),
    array (
      "line",
      'year',
      'Year',
      'Year when the competition takes place (number with four digits).',
      "2006",
      '^(0|\d{4})$',
      NULL
    ),
    array (
      "line",
      'month',
      'Month',
      'What month does the competition start? (number in 1..12)',
      "9",
      '^([0-9]|1[0-2])$',
      NULL
    ),
    array (
      "line",
      'day',
      'Day',
      'What day does the competition start? (number in 1..31)',
      "23",
      '^([0-9]|[1-3]\d)$',
      NULL
    ),
    array (
      "line",
      'endMonth',
      'End-Month',
      'What month does the competition end? (number in 1..12)',
      "9",
      '^([0-9]|1[0-2])$',
      NULL
    ),
    array (
      "line",
      'endDay',
      'End-Day',
      'What day does the competition end? (number in 1..31)',
      "24",
      '^([0-9]|[1-3]\d)$',
      NULL
    ),
    array (
      "text",
      'information',
      'Information',
      'Some information text about the competition.',
      "Euro 2006 is open to citizens of the European countries and Israel. [{Euro 2006 registration page}{http://www.speedcubing.com/events/euro2006/registration.html}]",
      $patternTextWithLinks,
      NULL
    ),
    array (
      "text",
      'wcaDelegate',
      'WCA Delegate(s)',
      'List of the WCA delegate attending the competition.',
      "[{Ron van Bruchem}{mailto:rbruchem@worldcubeassociation.org}]<br />[{Gilles Roux}{mailto:grrroux@free.fr}]",
      $patternTextWithLinks,
      NULL
    ),
    array (
      "text",
      'organiser',
      'Organiser(s)',
      "List of the competition organizers.",
      "[{Euro2006 organisation team}{mailto:davidj@seventowns.com}]<br />[{Ron van Bruchem}{mailto:rbruchem@worldcubeassociation.org}]",
      $patternTextWithLinks,
      NULL
    ),
    array (
      "line",
      'website',
      'Website',
      'The website of the competition.',
      "[{Rubiks.com}{http://www.rubiks.com}]",
      $patternTextWithLinks,
      NULL
    )
  );
}

#----------------------------------------------------------------------
function checkData () {
#----------------------------------------------------------------------
  global $chosenSubmit;
  global $isAdmin, $isConfirmed;

  if( !$chosenSubmit )
    return;

  if( $isAdmin || (! $isConfirmed ))
    checkRegularFields();

  checkCountrySpecifications();
  //checkEventSpecifications();
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
function checkCountrySpecifications () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $data, $dataError;

  $countries = dbQuery("SELECT * FROM Countries");
    foreach( $countries as $country) $allCountriesIds[$country['id']] = 1;

  $regIds = dbQuery( "SELECT id FROM Preregs WHERE competitionId='$chosenCompetitionId'" );
  foreach( $regIds as $regId ){
    $regId = $regId['id'];
    if( isset($data['reg'][$regId]['edit']) && $data['reg'][$regId]['edit'] ){

      $countryId = $data['reg'][$regId]['countryId'];
      if( !isset($allCountriesIds[$countryId])) $dataError["reg${regId}countryId"] = true;
    }
  }
}

/*
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
*/

#----------------------------------------------------------------------
function storeData () {
#----------------------------------------------------------------------
  global $data, $dataError, $dataSuccessfullySaved, $chosenSubmit, $chosenConfirm, $isConfirmed;
  global $isAdmin, $chosenCompetitionId;

  if( !$chosenSubmit )
    return;
  
  #--- Initially assume we'll fail.
  $dataSuccessfullySaved = false;

  #--- If errors were found, don't store and return.
  if( $dataError )
    return;

  #####----- Registration

  #-- Building show*
  $showPreregForm = $data["showPreregForm"] ? 1 : 0;
  $showPreregList = $data["showPreregList"] ? 1 : 0;

  #--- Store data
  dbCommand("UPDATE Competitions
               SET showPreregForm='$showPreregForm',
                   showPreregList='$showPreregList'
                WHERE id='$chosenCompetitionId'
  ");

  #--- Store registrations
  $regIds = dbQuery( "SELECT id FROM Preregs WHERE competitionId='$chosenCompetitionId'" );
  foreach( $regIds as $regId ){

    $regId = $regId['id'];
    #--- Delete registration
    if( isset($data['reg'][$regId]['delete']) && $data['reg'][$regId]['delete'] ){
      dbCommand( "DELETE FROM Preregs WHERE id='$regId'" );
    }

    else {

      #--- Edit registration
      if( isset($data['reg'][$regId]['edit']) && $data['reg'][$regId]['edit'] ){
        $queryEvent = '';

        #--- Build events query
        foreach( getEventSpecsEventIds( $data['eventSpecs'] ) as $eventId ){
          if( isset($data['reg'][$regId]["E$eventId"]) && $data['reg'][$regId]["E$eventId"] )
            $queryEvent .= "$eventId ";
        }
        $queryEvent = rtrim( $queryEvent ); # Remove last space.

        $personId = mysql_real_escape_string( $data['reg'][$regId]['personId'] );
        $name = mysql_real_escape_string( $data['reg'][$regId]['name'] );
        $countryId = mysql_real_escape_string( $data['reg'][$regId]['countryId'] );

        # echo "UPDATE Preregs SET name='$name', personId='$personId', countryId='$countryId', eventIds='$queryEvent' WHERE id='$regId'<br/>\n";

        #--- Query
        dbCommand( "UPDATE Preregs SET name='$name', personId='$personId', countryId='$countryId', eventIds='$queryEvent' WHERE id='$regId'" );
      }

      #--- Accept registration
      if( isset($data['reg'][$regId]['accept']) && $data['reg'][$regId]['accept'] )
        dbCommand( "UPDATE Preregs SET status='a' WHERE id='$regId'" );

    }
  } 

  $dataSuccessfullySaved = true;

  if(( ! $isAdmin ) && $isConfirmed ) return;

  $dataSuccessfullySaved = false;

  ####----- Competition

  #-- Building eventSpecs
  $events = '';
  foreach( getAllEventIds() as $eventId ){

    if ( $data["offer$eventId"] ){
      if( $events )
        $events .= " $eventId";
      else
        $events = "$eventId";
    }
  }

  #-- Building show*
  $data["showAtAll"] = $data["showAtAll"] ? 1 : 0;

  #--- Store data
  foreach( $data as $key => $value ) if( gettype($value) == 'string' ) $data[$key] = mysql_real_escape_string( $value );
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
                   eventSpecs='$events',
                   wcaDelegate='$wcaDelegate',
                   organiser='$organiser',
                   venue='$venue',
                   venueAddress='$venueAddress',
                   venueDetails='$venueDetails',
                   website='$website',
                   cellName='$cellName',
                   showAtAll='$showAtAll'
                WHERE id='$competitionId'
  ");

  foreach( $data as $key => $value ) if( gettype($value) == 'string' ) $data[$key] = stripslashes( $value );

  #--- Building the caches again
  require( 'admin/_helpers.php' );
  ob_start(); computeCachedDatabase( 'generated/cachedDatabase.php' ); ob_end_clean();

  #####----- Validation

  if( $chosenConfirm ){
    dbCommand("UPDATE Competitions
               SET isConfirmed='1'
                WHERE id='$chosenCompetitionId'
    ");
    $isConfirmed = true;
  }

  if( $data['unvalidate'] ){
    dbCommand("UPDATE Competitions
               SET isConfirmed='0'
                WHERE id='$chosenCompetitionId'
    ");
    $isConfirmed = false;
  }

  #--- Wow, we succeeded!
  $dataSuccessfullySaved = true;
}
