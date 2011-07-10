<?php

$chosenCompetitions = getCompetitions( 'map' );

$mapHeaderRequire = True;
require( '_header.php' );

offerChoices();
showMap();

require( '_footer.php' );

#----------------------------------------------------------------------
function showMap () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenYears, $chosenRegionId, $chosenPatternHtml;

  tableBegin( 'results', 1 );
  tableCaption( false, spaced(array( eventName($chosenEventId), chosenRegionName(), $chosenYears, $chosenPatternHtml ? "\"$chosenPatternHtml\"" : '' )));
  tableEnd();
  echo '<div id="map" style="width: 100%; height: 480px"></div>';

}

?>
