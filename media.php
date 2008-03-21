<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'media';
require( '_header.php' );

analyzeChoices();
offerChoices();
showMedia();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenType, $chosenRegionId, $chosenOrder;

  $chosenType      = getNormalParam( 'type' );
  $chosenRegionId  = getNormalParam( 'regionId' );
  $chosenOrder     = getNormalParam( 'order' );

  if( ! preg_match( '/^(article|report|multimedia)$/', $chosenType ))
    $chosenType = '';
  if( ! preg_match( '/^(date|submission)$/', $chosenOrder ))
    $chosenOrder = 'submission';
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenType, $chosenRegionId, $chosenOrder;

  #--- Submission
  echo "<p>You can submit a medium <a href='media_insertion.php'>here</a></p><hr />";
 
  #--- Filter
  displayChoices( array(
    regionChoice(),
    choice( 'type', 'Type', array(
      array( '',           'All' ),
      array( 'article',   'Articles' ),
      array( 'report',    'Reports' ),
      array( 'multimedia', 'Multimedia' )
      ), $chosenType ),
    choice( 'order', 'Sorted by', array(
      array( 'date',    'Competition Date' ),
      array( 'submission', 'Insertion Date' )
      ), $chosenOrder ),
    choiceButton( true, 'filter', 'Filter' )
  ));
}

#----------------------------------------------------------------------
function showMedia () {
#----------------------------------------------------------------------
  global $chosenType, $chosenRegionId, $chosenOrder;


  #--- Prepare conditions.
  $typeCondition = $chosenType ? "AND type='$chosenType'" : '';
  $orderCondition = ($chosenOrder == 'date') ? "ORDER BY competition.year DESC,
                                                         competition.month DESC,
                                                         competition.day DESC"
                                             : "ORDER BY timestampDecided DESC";
  
  #--- Get data of the (matching) media items.
  $media = dbQuery("
    SELECT media.*, competition.*, cellName, country.name AS countryName

    FROM CompetitionsMedia media, Competitions competition, Countries country
    WHERE 1
      AND competition.id = competitionId
      AND country.id = countryId
      $typeCondition
      " . regionCondition('competition') . "
      AND status = 'accepted'
    $orderCondition, cellName
  ");

  #--- Print the data.
  tableBegin( 'results', 6 );
#  tableCaption( false, spaced(array( eventName($chosenEventId), chosenRegionName(), $chosenYears )));
  tableHeader( split( '\\|', 'Insertion Date|Competition Date|Competition|Country, City|Type|Link' ),
               array( 5 => 'class="f"' ));

  foreach( $media as $data ){
    extract( $data );

    #--- Print the empty row.
    if ( $chosenOrder == 'submission' )
      $year = preg_replace( '/-.*/', '', $timestampDecided );

    if ( $previousYear  &&  $year != $previousYear )
      tableRowEmpty();
    $previousYear = $year;

    tableRow( array(
      preg_replace( '/ .*/', '', $timestampDecided ),
      competitionDate( $data ),
      competitionLink( $competitionId, $cellName ),
      "<b>$countryName</b>, $cityName",
      $type,
      externalLink( htmlEscape( $uri ), htmlEscape( $text )),
    ));
  }

  tableEnd();
}

?>
