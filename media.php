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
  global $chosenType;

  $chosenType  = getNormalParam( 'type' );
  
  if( ! preg_match( '/^(article|report|multimedia)$/', $chosenType ))
    $chosenType = '';
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenType;

  displayChoices( array(
    choice( 'type', 'Type', array(
      array( '',           'All' ),
      array( 'article',   'Articles' ),
      array( 'report',    'Reports' ),
      array( 'multimedia', 'Multimedia' )
      ), $chosenType ),
    choiceButton( true, 'filter', 'Filter' )
  ));
}

#----------------------------------------------------------------------
function showMedia () {
#----------------------------------------------------------------------
  global $chosenType;

  #--- Prepare conditions.
  $typeCondition = $chosenType ? "AND type='$chosenType'" : '';
  
  #--- Get data of the (matching) media items.
  $media = dbQuery("
    SELECT media.*, cellName
    FROM CompetitionsMedia media, Competitions competition
    WHERE 1
      AND competition.id = competitionId
      $typeCondition
    ORDER BY timestampDecided DESC, cellName
  ");

  tableBegin( 'results', 4 );
#  tableCaption( false, spaced(array( eventName($chosenEventId), chosenRegionName(), $chosenYears )));
  tableHeader( split( '\\|', 'Date|Competition|Type|Link' ),
               array( 3 => 'class="f"' ));

  foreach( $media as $data ){
    extract( $data );

    tableRow( array(
      preg_replace( '/ .*/', '', $timestampDecided ),
      competitionLink( $competitionId, $cellName ),
      $type,
      externalLink( $uri, $text ),
    ));
  }

  tableEnd();
}

?>
