<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );

analyzeChoices();
adminHeadline( 'Validate media' );
showDescription();
offerChoices();
showMedia();

require( '../_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenType, $chosenStatus, $chosenRegionId, $chosenOrder;

  $chosenType      = getNormalParam( 'type' );
  $chosenStatus    = getNormalParam( 'status' );
  $chosenRegionId  = getNormalParam( 'regionId' );
  $chosenOrder     = getNormalParam( 'order' );

  if( ! preg_match( '/^(article|report|multimedia)$/', $chosenType ))
    $chosenType = '';
 
  if( ! preg_match( '/^(date|submission)$/', $chosenOrder ))
    $chosenOrder = 'submission';

  if( ! preg_match( '/^(pending|accepted)$/', $chosenStatus )) 
  // Do we need a "refused" status ?
    $chosenStatus = 'pending';

}


#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>You can consult here all the media, and validate the new ones.</p>";

  echo "<p>You can submit a medium <a href='validate_media_ACTION.php?new42=" . rand() . "'>here</a></p>";
  
  echo "<hr />";
}


#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenType, $chosenStatus, $chosenRegionId, $chosenOrder;

  displayChoices( array(
    regionChoice( true ),
    choice( 'type', 'Type', array(
      array( '',           'All' ),
      array( 'article',   'Articles' ),
      array( 'report',    'Reports' ),
      array( 'multimedia', 'Multimedia' )
      ), $chosenType ),
    choice( 'order', 'Sorted by', array(
      array( 'date',    'Competition Date' ),
      array( 'submission', 'Submission/Insertion Date' )
		), $chosenOrder ),
    choice( 'status', 'Status', array(
      array( 'pending',   'Pending' ),
      array( 'accepted',   'Accepted' ),
      ), $chosenStatus ),
    choiceButton( true, 'filter' . rand(), ' Filter ' )
  ));

}
														  
#----------------------------------------------------------------------
function showMedia () {
#----------------------------------------------------------------------
  global $chosenType, $chosenStatus, $chosenRegionId, $chosenOrder;


  #--- Prepare conditions.
  $typeCondition = $chosenType ? "AND type='$chosenType'" : '';
  $accepted = ($chosenStatus == 'accepted');
  $order = $accepted ? "ORDER BY timestampDecided    DESC"
                     : "ORDER BY timestampSubmitted  DESC";
  $orderCondition = ($chosenOrder == 'date') ? "ORDER BY competition.year DESC,
                                                         competition.month DESC,
                                                         competition.day DESC"
                                             : $order;

  $headerDate = $accepted ? "Insertion" : "Submission";

  #--- Get data of the (matching) media items.
  $media = dbQuery("
    SELECT media.*,
           competition.year, competition.month, competition.day,
           competition.endMonth, competition.endDay,
           competition.countryId, competition.cityName,
           cellName,
           country.name AS countryName
    FROM CompetitionsMedia media, Competitions competition, Countries country
    WHERE 1
      AND competition.id = competitionId
      AND country.id = countryId
      $typeCondition
      " . regionCondition('competition') . "
      AND status='$chosenStatus'
    $orderCondition, cellName
  ");


  #--- Begin form and table.
  echo "<form action='validate_media_ACTION.php' method='POST'>\n";
  tableBegin( 'results', 7 );
  tableHeader( explode( '|', $headerDate . ' Date|Competition Date|Competition|Country, City|Type|Link|' ),
               array( 5 => 'class="f"' ));

  #--- Print results.
  foreach( $media as $data ){
    extract( $data );

    $timestamp = $accepted ? $timestampDecided : $timestampSubmitted;

    if ( $chosenOrder == 'submission' )
      $year = preg_replace( '/-.*/', '', $timestamp );

    if( $previousYear  &&  $year != $previousYear )
      tableRowEmpty();
    $previousYear = $year;


    $button = "<input type='submit' class='butt' value='Info' name='info$id' /> ";
    $button .= "<input type='submit' class='butt' value='Edit' name='edit$id' /> ";
    $button .= $accepted ? "<input type='submit' class='butt' value='Erase' name='refuse$id' />"
                         : "<input type='submit' class='butt' value='Accept' name='accept$id' />
                            <input type='submit' class='butt' value='Refuse' name='refuse$id' />";

    tableRow( array(
      preg_replace( '/ .*/', '', $timestamp ),
      competitionDate( $data ),
      competitionLink( $competitionId, $cellName ),
      "<b>$countryName</b>, $cityName",
      $type,
      externalLink( htmlEscape( $uri ), htmlEscape( $text )),
		$button,
    ));
  }

  #--- End form and table.
  tableEnd();
  echo "</form>";
}


?>
