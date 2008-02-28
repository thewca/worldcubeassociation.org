<?

#----------------------------------------------------------------------
function displayChoices ( $choices ) {
#----------------------------------------------------------------------

  displayChoicesWithMethod( 'GET', $choices );
}

#----------------------------------------------------------------------
function displayChoicesWithMethod ( $method, $choices ) {
#----------------------------------------------------------------------

  if( debug() )
    $choices[] = "<input type='hidden' name='debug5926' value='1' />";

  echo "<form action='$_SERVER[PHP_SELF]' method='$method'>\n";
  echo "  <table cellpadding='0' cellspacing='0' id='choices'>\n";
  echo "    <tr>\n\n";
  foreach( $choices as $choice )
    echo "<td valign='bottom'><div class='space'>$choice</div></td>\n\n";
  echo "    </tr>\n";
  echo "  </table>\n";
  echo "</form>\n\n";
}

#----------------------------------------------------------------------
function choiceButton ( $chosen, $id, $text ) {
#----------------------------------------------------------------------

  $class = $chosen ? 'chosenButton' : 'butt';
  return "<div class='buttborder'><input class='$class' type='submit' name='$id' value='$text' /> </div>";
}

#----------------------------------------------------------------------
function choice ( $id, $caption, $options, $chosenOption ) {
#----------------------------------------------------------------------

  $result = "<label for='$id'>$caption:<br /><select class='drop' id='$id' name='$id'>\n";
  $chosen = urlEncode( $chosenOption );
  foreach( $options as $option ){
    $nick = urlEncode( $option[0] );
    $text = htmlEntities( $option[1] );
    $selected = ($chosen  &&  $nick == $chosen) ? " selected='selected'" : "";
    $result .= "<option value='$nick'$selected>$text</option>\n";
  }
  $result .= "</select></label>";
  return $result;
}

#----------------------------------------------------------------------
function eventChoice ( $required ) {
#----------------------------------------------------------------------
  global $chosenEventId;

  if( ! $required ){
    $options[] = array( '', 'All' );
    $options[] = array( '', '' );
  }

   foreach( getAllEvents() as $event )
    $options[] = array( $event['id'], $event['cellName'] );
  return choice( 'eventId', 'Event', $options, $chosenEventId );
}

#----------------------------------------------------------------------
function competitionChoice ( $required ) {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  if( ! $required ){
    $options[] = array( '', 'All' );
    $options[] = array( '', '' );
  }

   foreach( getAllCompetitions() as $competition )
    $options[] = array( $competition['id'], $competition['cellName'] );
  return choice( 'competitionId', 'Competition', $options, $chosenCompetitionId );
}

#----------------------------------------------------------------------
function yearsChoice ( $until, $only ) {
#----------------------------------------------------------------------
  global $chosenYears;

  $options[] = array( '', 'All' );

  if( $until ){
    $options[] = array( '', '' );
    foreach( getAllUsedYears() as $row )
      $options[] = array( "until $row[year]", "until $row[year]" );
  }

  if( $only ){
    $options[] = array( '', '' );
    foreach( getAllUsedYears() as $row )
      $options[] = array( "only $row[year]", "only $row[year]" );
  }

  return choice( 'years', 'Years', $options, $chosenYears );
}

#----------------------------------------------------------------------
function regionChoice () {
#----------------------------------------------------------------------
  global $chosenRegionId;

  $options[] = array( '', 'World' );

  $options[] = array( '', '' );
  foreach( getAllUsedContinents() as $row )
    $options[] = array( $row['id'], $row['name'] );

  $options[] = array( '', '' );
  foreach( getAllUsedCountries() as $row )
    $options[] = array( $row['id'], $row['name'] );

  return choice( 'regionId', 'Region', $options, $chosenRegionId );
}

#----------------------------------------------------------------------
function textFieldChoice ( $id, $caption, $content ) {
#----------------------------------------------------------------------

  return "$caption:<br /><input name='$id' type='text' value='$content' />";
}

?>
