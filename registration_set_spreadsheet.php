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

  #--- Start Table
  tableBegin( 'results', 6 );
  tableHeader( explode( '|', 'Event|Time Format|Round 1|Round 2|Round 3|Round 4' ),
               array( 5 => 'class="f"' ));


  #--- Show the events.

  $eventIds = getEventSpecsEventIds( $data['eventSpecs'] );
  foreach( $eventIds as $eventId ) {
    $row = array( eventCellName( $eventId ));

    #--- Choose Unit.

    switch( $preferedUnit[$eventId] ) {
      case 'seconds':
        $unitChoice = "<select class='drop' id='unit$eventId' name='unit$eventId'>\n";
        $unitChoice .= "  <option value='seconds' selected='selected'>Seconds</option>\n";
        $unitChoice .= "  <option value='minutes'>Minutes</option>\n";
        $unitChoice .= "</select>\n";
        break;
      case 'minutes':
        $unitChoice = "<select class='drop' id='unit$eventId' name='unit$eventId'>\n";
        $unitChoice .= "  <option value='seconds'>Seconds</option>\n";
        $unitChoice .= "  <option value='minutes' selected='selected'>Minutes</option>\n";
        $unitChoice .= "</select>\n";
        break;
      case 'number':
        $unitChoice = "  Number<input type='hidden' id='unit$eventId' name='unit$eventId' value='number' />\n";
        break;
      case 'multi':
        $unitChoice = "  Multi BLD<input type='hidden' id='unit$eventId' name='unit$eventId' value='multi' />\n";
        break;
    }
    $row[] = $unitChoice;


    $row2 = array( '', '' );

    $rounds = dbQuery( "SELECT * FROM Rounds ORDER BY rank" );
    foreach( array( 1, 2, 3, 4) as $roundNumber ) {

      #--- Choose Round.

      $roundChoice = "<select class='drop' id='round$roundNumber$eventId' name='round$roundNumber$eventId'>\n";
      $roundChoice .= "  <option value='n' >-</option>\n";
      foreach( $rounds as $round ){
        extract( $round );
        if(( $id == 'f' ) and ( $roundNumber == 1 ))
          $roundChoice .= "  <option value='$id' selected='selected'>$cellName</option>\n";
        else
          $roundChoice .= "  <option value='$id'>$cellName</option>\n";
      }
      $row[] = $roundChoice;

      #--- Choose Format.

      $formatChoice = "<select class='drop' id='format$roundNumber$eventId' name='format$roundNumber$eventId'>\n";
      foreach( $formats as $format ) {
        $formatId = $format['id'];
        $formatName = $format['name'];
        if( $possibleFormats[$eventId][$formatId] ) {
          if( $preferedFormat[$eventId] == $formatId )
            $formatChoice .= "  <option value='$formatId' selected='selected'>$formatName</option>\n";
          else
            $formatChoice .= "  <option value='$formatId'>$formatName</option>\n";
        }
      }
      $formatChoice .= "</select>\n";

      $row2[] = $formatChoice;
    }

    tableRow( $row );
    tableRow( $row2 );

  }

  tableEnd();

  echo "<input id='submit' name='submit' type='submit' value='Submit' />\n</form><br/>\n";
  echo "<a href='competition_edit.php?competitionId=$chosenCompetitionId&amp;password=$chosenPassword&amp;rand=".rand()."'>Back</a>\n";
}

?>
