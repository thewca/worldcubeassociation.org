<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '_header.php' );

analyzeChoices();
if( checkPasswordAndLoadData() ) {
  showView();
}

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenPassword = getNormalParam( 'password' );
}

#----------------------------------------------------------------------
function checkPasswordAndLoadData () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $data;

  #--- Load the competition data from the database.
  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );
  
  #--- Check the competitionId.
  if( count( $results ) != 1 ){
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  #--- Competition exists, so get its data.
  $data = $results[0];

  #--- Check the password.
  if( $chosenPassword != $data['password'] ){
    showErrorMessage( "wrong password" );
    return false;
  }

  return true;
}

#----------------------------------------------------------------------
function showView () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $data;
    
  echo "<form method='POST' action='registration_spreadsheet.php?competitionId=$chosenCompetitionId&password=$chosenPassword'>\n";

  $formats = dbQuery( "SELECT * FROM Formats" );

  #--- Start Table

  echo "<table border='1' cellspacing='0' cellpadding='4'>\n";
  echo "<tr bgcolor='#CCCCFF'><td>Event</td>";

  #--- Fill header.

  foreach( $formats as $format )
    echo "<td>" . $format['name'] . "</td>";
  echo "<td>Use seconds</td><td>Use minutes</td>";
  echo "</tr>\n";

  #--- List of possible formats for each event, according to http://www.worldcubeassociation.org/regulations .

  $eventIds = getAllEventIds();
  foreach( $eventIds as $eventId ) {
    $possibleFormats[$eventId]['1'] = TRUE;
    $possibleFormats[$eventId]['2'] = TRUE;
    $possibleFormats[$eventId]['3'] = TRUE;

    if( in_array( $eventId, array( '333', '222', '444', '555', 'clock', 'magic', 'mmagic', 'minx', 'pyram', 'sq1', '333oh' )))
      $possibleFormats[$eventId]['a'] = TRUE;
    else
      $possibleFormats[$eventId]['a'] = FALSE;

    if( in_array( $eventId, array( '666', '777', '333ft' )))
      $possibleFormats[$eventId]['m'] = TRUE;
    else
      $possibleFormats[$eventId]['m'] = FALSE;
  }

  #--- List of prefered formats for each event, according to http://www.worldcubeassociation.org/regulations .

  $preferedFormat = array(
    "333"=>"a",
    "444"=>"a",
    "555"=>"a",
    "222"=>"a",
    "333bf"=>"2", # Best of x
    "333oh"=>"a",
    "333fm"=>"1", # Best of x
    "333ft"=>"1", # Best of x
    "minx"=>"a",
    "pyram"=>"a",
    "sq1"=>"a",
    "clock"=>"a",
    "666"=>"m",
    "777"=>"m",
    "magic"=>"a",
    "mmagic"=>"a",
    "444bf"=>"1", # Best of x
    "555bf"=>"1", # Best of x
    "333mbf"=>"1");

  #--- List of prefered unit for each event, according to me :).

  $preferedUnit = array(
    "333"=>"seconds",
    "444"=>"minutes",
    "555"=>"minutes",
    "222"=>"seconds",
    "333bf"=>"minutes",
    "333oh"=>"seconds",
    "333fm"=>"number",
    "333ft"=>"minutes",
    "minx"=>"minutes",
    "pyram"=>"seconds",
    "sq1"=>"seconds",
    "clock"=>"seconds",
    "666"=>"minutes",
    "777"=>"minutes",
    "magic"=>"seconds",
    "mmagic"=>"seconds",
    "444bf"=>"minutes",
    "555bf"=>"minutes",
    "333mbf"=>"multi");


  #--- Show the events.

  $eventIds = getEventSpecsEventIds( $data['eventSpecs'] );
  foreach( $eventIds as $eventId ) {
    echo "<tr><td>" . eventCellName( $eventId ) . "</td>";

    #--- Choose Format.

    foreach( $formats as $format ) {
      $formatId = $format['id'];
      if( $possibleFormats[$eventId][$formatId] ) {
        if( $preferedFormat[$eventId] == $formatId )
          echo "<td><input id='format$eventId$formatId' name='format$eventId' type='radio' value='$formatId' checked='checked' /></td>\n";
        else
          echo "<td><input id='format$eventId$formatId' name='format$eventId' type='radio' value='$formatId' /></td>\n";
      }
      else
        echo "<td></td>\n";
    }

    #--- Choose Unit.


    switch( $preferedUnit[$eventId] ) {
      case 'seconds':
        echo "<td><input id='unit${eventId}s' name='unit$eventId' type='radio' value='seconds' checked='checked' /></td>";
        echo "<td><input id='unit${eventId}m' name='unit$eventId' type='radio' value='minutes' /></td>";
        break;
      case 'minutes':
        echo "<td><input id='unit${eventId}s' name='unit$eventId' type='radio' value='seconds' /></td>";
        echo "<td><input id='unit${eventId}m' name='unit$eventId' type='radio' value='minutes' checked='checked' /></td>";
        break;
      default:
        echo "<td><input id='unit$eventId' name='unit$eventId' type='hidden' value='".$preferedUnit[$eventId]."' /></td><td></td>"; # Special values.
    }

  echo "</tr>\n";
  }

  echo "</table>\n";

  echo "<input id='submit' name='submit' type='submit' value='Submit' />\n</form><br/>\n";
  echo "<a href='competition_edit.php?competitionId=$chosenCompetitionId&amp;password=$chosenPassword&amp;rand=".rand()."'>Back</a>\n";
}

?>
