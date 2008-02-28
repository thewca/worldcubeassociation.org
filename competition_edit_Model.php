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
      'reports',
      'Reports',
      'List of links to reports about the competition.',
      "[{Sven Gowal}{http://rubik.talk-sep.net/?page=EC2006}]<br />[{Stefan Pochmann}{http://stefan-pochmann.de/spocc/other_stuff/events/euro2006/}]",
      $patternLinkList
    ),
    array (
      "text",
      'multimedia',
      'Multimedia',
      'List of links to multimedia.',
      "[{Gunnar Krig}{http://video.google.com/videoplay?docid=-502642045895676758&amp;hl=en}]<br />[{Gilles Roux}{http://grrroux.free.fr/VideosEC2006/ec06.avi}]",
      $patternLinkList
    ),
    array (
      "text",
      'articles',
      'Articles',
      'List of links to articles.',
      "[{Belgian newspapers}{http://www.belgiancubes.be:80/news/}]<br />[{5 year old Daniël Hop}{http://www.gelderlander.nl:80/maasenwaal/article690716.ece}]",
      $patternLinkList
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

}

#----------------------------------------------------------------------
function storeData () {
#----------------------------------------------------------------------
  global $data, $dataError, $dataSuccessfullySaved;
  
  #--- Initially assume we'll fail.
  $dataSuccessfullySaved = false;
  
  #--- If errors were found, don't store and return.
  if( $dataError )
    return;


  #--- Wow, we succeeded!
  $dataSuccessfullySaved = true;
}

?>
