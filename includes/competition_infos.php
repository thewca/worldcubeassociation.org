<?php

#----------------------------------------------------------------------
function showCompetitionInfos () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  #--- Get the competition infos from the database.
  $competition = getFullCompetitionInfos( $chosenCompetitionId );
  extract( $competition );

  #--- Show the infos.
  echo "<h1>$name</h1>\n";

  #--- Start the table.
  echo "<table width='100%' id='competitionDetails'><tr valign='top'>\n";

  #--- Left part.
  echo "<td style='width:70%'><table>";
  showItem( 'key', "Date",         array( competitionDate( $competition ), $year ));
  showItem( 'key', "City",         array( $cityName, $countryId ));  #TOD?: should be countryName
  showItem( 'key', "Venue",        array( $venue ));
  showItem( 'sub', "Address",      array( $venueAddress ));
  showItem( 'sub', "Details",      array( $venueDetails ));
  showItem( 'key', "Website",      array( $website ));
  showItem( 'key', "Organiser",    array( $organiser ));
  showItem( 'key', "WCA Delegate", array( $wcaDelegate ));
  echo "</table></td>";

  #--- Right part.
  echo "<td style='width:30%'><table>";
  showItem( 'key', "Information",  array( $information ));
  showListItemNew( 'View results for', computeCompetitionEvents( $eventSpecs ));
  showListItemNew( 'Reports', computeMedia( 'report' ));
  showListItemNew( 'Articles', computeMedia( 'article' ));
  showListItemNew( 'Multimedia', computeMedia( 'multimedia' ));
  echo "</table></td>";

  #--- End table.
  echo "</tr></table>";
}

#----------------------------------------------------------------------
function showItem ( $class, $key, $values ) {
#----------------------------------------------------------------------
  $value = implode( ", ", array_filter( array_map( 'processLinks', $values ), 'strip_tags' ));
  if( $value )
    echo "  <tr> <td class='$class'>$key</td> <td>$value</td> </tr>\n";
}

#----------------------------------------------------------------------
function processLinkList ( $key, $values ) {
#----------------------------------------------------------------------
  preg_match_all( '/ \[ \{ ([^]]*) \} \{ ([^]]*) \} \] /x', $values, $matches, PREG_SET_ORDER );
  if( ! $matches )
    return '';
  $result = "<span style='white-space:nowrap'><select id='$key' style='width:300px'>\n";
  foreach( $matches as $match ){
    list( $whole, $text, $url ) = $match;
    $result .= "    <option value='$url'>$text</option>\n";
  }
  $result .= "</select>&nbsp;";
  $result .= "<input type='button' value='Go' onclick='window.open( document.getElementById(\"$key\").value )' /></span>\n";
  return $result;
}

#----------------------------------------------------------------------
function showListItemNew ( $key, $encodedLinkList ) {
#----------------------------------------------------------------------
  global $competitionResults;
  preg_match_all( '/ \[ \{ ([^]]*) \} \{ ([^]]*) \} \] /x', $encodedLinkList, $matches, PREG_SET_ORDER );
  if( $matches ){
    echo "  <tr> <td class='choice'>$key</td> <td><span style='white-space:nowrap'><select id='$key' style='width:300px'>\n";
    foreach( $matches as $match ){
      list( $whole, $text, $url ) = $match;
      echo "    <option value='$url'>$text</option>\n";
    }
    echo "</select>&nbsp;";
    if( true || $competitionResults )
      echo "<input type='button' value='Go' onclick='window.location = document.getElementById(\"$key\").value' /></span>\n";
    echo "</td> </tr>\n";
  }
}

#----------------------------------------------------------------------
function computeCompetitionEvents ( $eventSpecs ) {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenAllResults;

  $events = "";
  foreach( getEventSpecsEventIds( $eventSpecs ) as $eventId ){
    $url = $chosenAllResults ? "#$eventId" : "competition.php?competitionId=$chosenCompetitionId&amp;allResults=1#$eventId";
    $events .= '[{' . eventCellName( $eventId ) . '}{' . $url . '}]';
  }
  return $events;
}

#----------------------------------------------------------------------
function computeMedia ( $mediaType ) {
#----------------------------------------------------------------------

  global $chosenCompetitionId;

  assertFoo( preg_match( '/^(article|report|multimedia)$/', $mediaType) , "Bad call of function 'computeMedia',
                                                                           must be article|report|multimedia" );

  $media = dbQuery("
    SELECT *

    FROM CompetitionsMedia
    WHERE competitionId = '$chosenCompetitionId'
      AND type = '$mediaType'
      AND status = 'accepted'
    ORDER BY timestampDecided DESC
  ");

  $mediaList = "";
  foreach( $media as $medium ){
    extract($medium);

    $mediaList .= '[{' . $text . '}{' . $uri . '}]';
  }

  return $mediaList;

}

?>
