<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'media';
require( 'includes/_header.php' );

analyzeChoices();
offerChoices();
showMedia();

require( 'includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenYears, $chosenRegionId, $chosenOrder;

  $chosenYears     = getNormalParam( 'years' );
  $chosenRegionId  = getNormalParam( 'regionId' );
  $chosenOrder     = getNormalParam( 'order' );

  if ( getNormalParam( 'filter' ) == '' )
    $chosenYears = "only " . wcaDate( 'Y' );

  if( ! preg_match( '/^(date|submission)$/', $chosenOrder ))
    $chosenOrder = 'submission';
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenYears, $chosenRegionId, $chosenOrder;

  #--- Submission
  echo "<p>You can submit media <a href='media_insertion.php'>here</a></p><hr/><br/>";


  #--- Filter
  displayChoices( array(
    regionChoice( true ),
    yearsChoice( true, false, false, true ),
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
  global $chosenYears, $chosenRegionId, $chosenOrder;


  #--- Prepare conditions.
  $yearCondition = yearCondition();
  $regionCondition = regionCondition('competition');
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
      $yearCondition
      $regionCondition
      AND status = 'accepted'
    $orderCondition, cellName
  ");

  #--- Print the data.
  tableBegin( 'results', 6 );
#  tableCaption( false, spaced(array( eventName($chosenEventId), chosenRegionName(), $chosenYears )));
  tableHeader( explode( '|', 'Insertion Date|Competition Date|Competition|Country, City|Type|Link' ),
               array( 5 => 'class="f"' ));

  foreach( $media as $data ){
    extract( $data );

    #--- Print the empty row.
    if ( $chosenOrder == 'submission' )
      $year = preg_replace( '/-.*/', '', $timestampDecided );

    if ( isset( $previousYear ) &&  $year != $previousYear )
      tableRowEmpty();
    $previousYear = $year;

    tableRow( array(
      preg_replace( '/ .*/', '', $timestampDecided ),
      competitionDate( $data ),
      competitionLink( $competitionId, $cellName ),
      "<b>$countryName</b>, $cityName",
      $type,
      externalLink( $uri, $text ),
    ));
  }

  tableEnd();
}

?>
