<?php

getCompetitions();

$mapHeaderRequire = True;
require( '_header.php' );

offerChoices();
showMap();

require( '_footer.php' );

#----------------------------------------------------------------------
function getCompetitions () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenYears, $chosenRegionId, $chosenCompetitions;

  #--- Prepare stuff for the query.
  if( $chosenEventId )
    $eventCondition = "AND eventSpecs REGEXP '[[:<:]]${chosenEventId}[[:>:]]'";

  $yearCondition = yearCondition();

  if( $chosenRegionId  &&  $chosenRegionId != 'World' )
    $regionCondition = "AND (competition.countryId = '$chosenRegionId' OR continentId = '$chosenRegionId')"; #TODP: remove the 'competition.' once we get countryId out of the Results table.

  #--- Get data of the (matching) competitions.
  $chosenCompetitions = dbQuery("
    SELECT DISTINCT
      competition.*,
      country.name AS countryName
    FROM
      Competitions competition,
      Countries    country
    WHERE 1
      AND country.id = countryId
      AND showAtAll = 1
      $eventCondition
      $yearCondition
      $regionCondition
    ORDER BY
      longitude, year, month, day
  ");

}


#----------------------------------------------------------------------
function showMap () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenYears, $chosenRegionId;

  tableBegin( 'results', 1 );
  tableCaption( false, spaced(array( eventName($chosenEventId), chosenRegionName(), $chosenYears )));
  tableEnd();
  echo '<div id="map" style="width: 100%; height: 480px"></div>';

}

?>
