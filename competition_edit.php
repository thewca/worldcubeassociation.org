<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '_header.php' );

analyzeChoices();
if( checkPasswordAndLoadData() ){
  checkData();
  storeData();
  showView();
}

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $chosenSubmit;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenPassword = getNormalParam( 'password' );
  $chosenSubmit = getBooleanParam( 'submit' );
}

#----------------------------------------------------------------------
function checkPasswordAndLoadData () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $chosenSubmit, $data;

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
  
  #--- If this is just view, not yet submit, extract the database data and return;
  if( ! $chosenSubmit ){
  
    #--- Extract the events.
    foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event ){
      extract( $event );
  
      if( preg_match( "/(^| )$id\b(=(\d*)\/(\d*)\/(\w*)\/(\d*)\/(\d*))?/", $data['eventSpecs'], $matches )){
        $data["offer$id"] = 1;
        $data["personLimit$id"]      = $matches[3];
        $data["timeLimit$id"]        = $matches[4];
        $data["timeFormat$id"]       = $matches[5];
        $data["qualify$id"]          = $matches[6];
        $data["qualifyTimeLimit$id"] = $matches[7];
      }
    }
    
    #--- Done.
    return true;
  }
  
  #--- Set the data to the entered values.
  $data = getRawParamsThisShouldBeAnException();
  $data['id'] = $chosenCompetitionId;

  return true;
}

#----------------------------------------------------------------------
function checkData () {
#----------------------------------------------------------------------
  global $chosenSubmit;

  if( !$chosenSubmit )
    return;

  checkCountrySpecifications();
}

#----------------------------------------------------------------------
function checkCountrySpecifications () {
#----------------------------------------------------------------------
  global $data, $dataError;

  $competitionId = $data['competitionId'];

  $countries = dbQuery("SELECT * FROM Countries");
    foreach( $countries as $country) $allCountriesIds[] = $country['id'];

  $regIds = dbQuery( "SELECT id FROM Preregs WHERE competitionId='$competitionId'" );
  foreach( $regIds as $regId ){
    $regId = $regId['id'];
    if( $data["reg${regId}edit"] ){

      $countryId = $data["reg${regId}countryId"];
      if( !in_array($countryId, $allCountriesIds)) $dataError["reg${regId}countryId"] = true;
    }
  }
}

#----------------------------------------------------------------------
function storeData () {
#----------------------------------------------------------------------
  global $data, $dataError, $dataSuccessfullySaved, $chosenSubmit;

  if( !$chosenSubmit )
    return;
  
  #--- Initially assume we'll fail.
  $dataSuccessfullySaved = false;
  
  #--- If errors were found, don't store and return.
  if( $dataError )
    return;

  #-- Building show*
  $showPreregForm = $data["showPreregForm"] ? 1 : 0;
  $showPreregList = $data["showPreregList"] ? 1 : 0;

  #--- Store data
  $competitionId = $data['competitionId'];

  dbCommand("UPDATE Competitions
               SET showPreregForm='$showPreregForm',
                   showPreregList='$showPreregList'
                WHERE id='$competitionId'
  ");

  #--- Store registrations
  $regIds = dbQuery( "SELECT id FROM Preregs WHERE competitionId='$competitionId'" );
  foreach( $regIds as $regId ){

    $regId = $regId['id'];
    #--- Delete registration
    if( $data["reg${regId}delete"] ){
      dbCommand( "DELETE FROM Preregs WHERE id='$regId'" );
    }

    else {

      #--- Edit registration
      if( $data["reg${regId}edit"] ){

        #--- Build events query
        foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event ){
          $eventId = $event['id'];

          if( $data["offer$eventId"] ){
            $ee = $data["reg${regId}E$eventId"] ? 1 : 0;
            $queryEvent .= "E$eventId='$ee', ";
          }
        }

        $personId = mysql_real_escape_string( $data["reg${regId}personId"] );
        $name = mysql_real_escape_string( $data["reg${regId}name"] );
        $countryId = mysql_real_escape_string( $data["reg${regId}countryId"] );

        #--- Query
        dbCommand( "UPDATE Preregs SET $queryEvent name='$name', personId='$personId', countryId='$countryId' WHERE id='$regId'" );
      }

      #--- Accept registration
      if( $data["reg${regId}accept"] )
        dbCommand( "UPDATE Preregs SET status='a' WHERE id='$regId'" );

    }
  } 

  #--- Wow, we succeeded!
  $dataSuccessfullySaved = true;
}

#----------------------------------------------------------------------
function showView () {
#----------------------------------------------------------------------

  showSaveMessage();
  startForm();
  showRegs();
  showMap();
  endForm();
}

#----------------------------------------------------------------------
function startForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;
    
  echo "<form method='POST' action='competition_edit.php?competitionId=$chosenCompetitionId&password=$chosenPassword&rand=" . rand() . "'>\n";
}

#----------------------------------------------------------------------
function showSaveMessage () {
#----------------------------------------------------------------------
  global $chosenSubmit, $dataSuccessfullySaved;
  
  #--- If no submit, don't say anything.
  if( ! $chosenSubmit )
    return;
  
  #--- Report success or error.
  noticeBox2( $dataSuccessfullySaved,
    "Data was successfully saved.",
    "Data wasn't saved. See red fields below for invalid data."
  );
}

#----------------------------------------------------------------------
function showRegs () {
#----------------------------------------------------------------------
  global $data, $dataError, $chosenCompetitionId;

  echo "<h1>Registration</h1>";

  if( $data["showPreregForm"] )
    echo "<p><input id='showPreregForm' name='showPreregForm' type='checkbox' checked='checked' /> Check if you want to start a <b>Registration Form</b></p>\n";
  else
    echo "<p><input id='showPreregForm' name='showPreregForm' type='checkbox' /> Check if you want to start a <b>Registration Form</b></p>\n";

  if( $data["showPreregList"] )
    echo "<p><input id='showPreregList' name='showPreregList' type='checkbox' checked='checked' /> Check if you want the <b>Registered Competitors</b> to be visible</p>\n";
  else
    echo "<p><input id='showPreregList' name='showPreregList' type='checkbox' /> Check if you want the <b>Registered Competitors</b> to be visible</p>\n";

  $comps = dbQuery( "SELECT * FROM Preregs WHERE competitionId='$chosenCompetitionId' ORDER BY id" );

  if( ! count( $comps)) return;



  #--- Start the table.
  echo "<br /><b>Registered Competitors</b><br/>\n";
  echo "<ul><li><p>A : Accept, D : Delete, E : Edit.</p></li>\n";
  echo "<li><p>Pending registrations are in light red, accepted registrations are in light green.</p></li>\n";
  echo "<li><p>If you want to edit a person, first check its 'edit' checkbox for this to work.</p></li></ul>\n";
  
  echo "<table border='1' cellspacing='0' cellpadding='4'>\n";
  echo "<tr bgcolor='#CCCCFF'><td>A</td><td>D</td><td>E</td><td>WCA Id</td><td>Name</td><td>Country</td>\n";
  foreach( getAllEvents() as $event ){
    extract( $event );
    if( $data["offer$id"] )
      echo "<td style='font-size:9px'>$id</td>\n";
  }
  foreach( getAllUnofficialEvents() as $event ){
    extract( $event );
    if( $data["offer$id"] )
      echo "<td style='font-size:9px;color:#999'>$id</td>\n";
  }
  echo "</tr>\n";

  foreach( $comps as $comp ){
    extract( $comp );
    $name = htmlEntities( $name, ENT_QUOTES );
    $personId = htmlEntities( $personId, ENT_QUOTES );

    if( $dataError["reg${id}countryId"] ) echo "<tr bgcolor='#FF3333'>";
    else if( $status == 'p' ) echo "<tr bgcolor='#FFCCCC'>";
    else if( $status == 'a' ) echo "<tr bgcolor='#CCFFCC'>";
    echo "  <td><input type='checkbox' id='reg${id}accept' name='reg${id}accept' value='1' /></td>\n";
    echo "  <td><input type='checkbox' id='reg${id}delete' name='reg${id}delete' value='1' /></td>\n";
    echo "  <td><input type='checkbox' id='reg${id}edit' name='reg${id}edit' value='1' /></td>\n";
    echo "  <td><input type='text' id='reg${id}personId' name='reg${id}personId' value='$personId' size='10' maxlength='10' /></td>\n";
    echo "  <td><input type='text' id='reg${id}name' name='reg${id}name' value='$name' size='25' /></td>\n";
    echo "  <td><input type='text' id='reg${id}countryId' name='reg${id}countryId' value='$countryId' size='15' /></td>\n";    

    foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event ){
      $eventId = $event['id'];
      if( $data["offer$eventId"] ){
        switch ($comp["E$eventId"]) {
          case 0: echo "  <td><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' /></td>\n"; break;
          case 1: echo "  <td><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' checked='checked' /></td>\n"; break;
          default:echo "  <td bgcolor='#FFCCCC'><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' checked='checked' /></td>\n"; break;
        }
      }
    }
    echo "</tr>\n";
  }
  echo "</table>\n";

  echo "<ul><li><p>See <a href='registration_information.php?competitionId=$chosenCompetitionId&password=$data[password]'>extra registration information</a></p></li>\n"; 
  echo "<li><p>Download the <a href='registration_sheet.php?competitionId=$chosenCompetitionId'>registration excel sheet</a> in .csv format.</a></p></li>\n"; 
  echo "<li><p>If you want to include the <b>form</b> in your website, use an iframe with <a href='http://www.worldcubeassociation.org/results/competition_registration.php?competitionId=$chosenCompetitionId'>this link</a></p></li>\n"; 
  echo "<li><p>If you want to include the <b>list</b> in your website, use an iframe with <a href='http://www.worldcubeassociation.org/results/competition_registration.php?competitionId=$chosenCompetitionId&list=1'>this link</a></p></li></ul>\n"; 

}

#----------------------------------------------------------------------
function showMap () {
#----------------------------------------------------------------------
  global $data, $chosenCompetitionId;

  echo "<hr><h1>Map</h1>";

  echo "<input type='hidden' name='latitude' id='latitude' value='$data[latitude]' />";
  echo "<input type='hidden' name='longitude' id='longitude' value='$data[longitude]' />";
  echo "<p>Current coordinates are Latitude = " . $data['latitude'] . " and Longitude = " . $data['longitude'] . ".</p>";
  echo "<p><a href='map_coords.php?competitionId=$chosenCompetitionId&password=$data[password]'>Change</a> the coordinates.</p>";

}

#----------------------------------------------------------------------
function endForm () {
#----------------------------------------------------------------------

  echo "<center><table border='0' cellspacing='10' cellpadding='5' width='10'><tr>\n";
  echo "<td bgcolor='#33FF33'><input id='submit' name='submit' type='submit' value='Submit' /></td>\n";
  echo "<td bgcolor='#FF0000'><input type='reset' value='Reset' /></td>\n";
  echo "</tr></table></center>\n";
  
  echo "</form>";
}

?>
