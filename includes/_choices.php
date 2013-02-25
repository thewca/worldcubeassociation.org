<?

#----------------------------------------------------------------------
function displayChoices ( $choices ) {
#----------------------------------------------------------------------

  displayChoicesWithMethod( 'get', $choices );
}

#----------------------------------------------------------------------
function displayChoicesWithMethod ( $method, $choices ) {
#----------------------------------------------------------------------

  if( wcaDebug() )
    $choices[] = "<input type='hidden' name='debug5926' value='1' />";

  echo "<form method='$method'>\n";
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

  $result = $caption ? "<label for='$id'>$caption:<br />" : '';
  $result .= "<select class='drop' id='$id' name='$id'>\n";
  $chosen = urlEncode( $chosenOption );
  foreach( $options as $option ){
    $nick = urlEncode( $option[0] );
    $text = htmlEntities( $option[1], ENT_QUOTES, "UTF-8" );
    $selected = ($chosen  &&  $nick == $chosen) ? " selected='selected'" : "";
    $result .= "<option value='$nick'$selected>$text</option>\n";
  }
  $result .= "</select>";
  if( $caption )
    $result .= "</label>";
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
function yearsChoice ($all, $current, $until, $only ) {
#----------------------------------------------------------------------
  global $chosenYears;

  if( $all ){
    $options[] = array( '', 'All' );
    if( $current )
      $options[] = array( 'current', 'Current' );
    $options[] = array( '', '' );
  }

  if( $until ){
    foreach( getAllUsedYears() as $row )
      $options[] = array( "until $row[year]", "until $row[year]" );
    $options[] = array( '', '' );
  }

  if( $only ){
    foreach( getAllUsedYears() as $row )
      $options[] = array( "only $row[year]", "only $row[year]" );
  }

  return choice( 'years', 'Years', $options, $chosenYears );
}

#----------------------------------------------------------------------
function regionChoice ( $competitions ) {
#----------------------------------------------------------------------
  global $chosenRegionId;

  $options[] = array( '', 'World' );

  $options[] = array( '', '' );
  foreach( getAllUsedContinents() as $row )
    $options[] = array( $row['id'], $row['name'] );

  $options[] = array( '', '' );
  if( $competitions )
    foreach( getAllUsedCountriesCompetitions() as $row )
      $options[] = array( $row['id'], $row['name'] );

  else
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
