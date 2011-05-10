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

    #--- Done.
    return true;
  }
  
  #--- Set the data to the entered values.
  $data = getRawParamsThisShouldBeAnException();

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
  global $chosenCompetitionId, $data, $dataError;

  $countries = dbQuery("SELECT * FROM Countries");
    foreach( $countries as $country) $allCountriesIds[] = $country['id'];

  $regIds = dbQuery( "SELECT id FROM Preregs WHERE competitionId='$chosenCompetitionId'" );
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
  global $data, $dataError, $dataSuccessfullySaved, $chosenSubmit, $chosenCompetitionId;

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
  dbCommand("UPDATE Competitions
               SET showPreregForm='$showPreregForm',
                   showPreregList='$showPreregList'
                WHERE id='$chosenCompetitionId'
  ");

  #--- Store registrations
  $regIds = dbQuery( "SELECT id FROM Preregs WHERE competitionId='$chosenCompetitionId'" );
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
        foreach( getEventSpecsEventIds( $data['eventSpecs'] ) as $eventId ){
          $ee = $data["reg${regId}E$eventId"] ? 1 : 0;
          $queryEvent .= "E$eventId='$ee', ";
        }

        $personId = mysql_real_escape_string( $data["reg${regId}personId"] );
        $name = mysql_real_escape_string( $data["reg${regId}name"] );
        $countryId = mysql_real_escape_string( $data["reg${regId}countryId"] );

        echo "UPDATE Preregs SET $queryEvent name='$name', personId='$personId', countryId='$countryId' WHERE id='$regId'<br/>\n";

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
  endForm();
}

#----------------------------------------------------------------------
function startForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;
    
  echo "<form method='post' action='competition_edit.php?competitionId=$chosenCompetitionId&amp;password=$chosenPassword&amp;rand=" . rand() . "'>\n";
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

  echo "<p><input type='hidden' name='eventSpecs' id='eventSpecs' value='$data[eventSpecs]' /></p>\n";

  $comps = dbQuery( "SELECT * FROM Preregs WHERE competitionId='$chosenCompetitionId' ORDER BY id" );

  if( ! count( $comps)) return;

  #--- Start the table.
  echo "<h4>Registered Competitors</h4>\n";
  echo "<ul><li><p>A : Accept, D : Delete, E : Edit.</p></li>\n";
  echo "<li><p>Pending registrations are in light red, accepted registrations are in light green.</p></li>\n";
  echo "<li><p>If you want to edit a person, first check its 'edit' checkbox for this to work.</p></li></ul>\n";
  
  echo "<table border='1' cellspacing='0' cellpadding='4'>\n";
  echo "<tr style='background-color:#CCCCFF'><td>A</td><td>D</td><td>E</td><td>WCA Id</td><td>Name</td><td>Country</td>\n";
  foreach( getEventSpecsEventIds( $data['eventSpecs'] ) as $eventId ){
    if( isOfficialEvent( $eventId ) )
      echo "<td style='font-size:9px'>$eventId</td>\n";
    else
      echo "<td style='font-size:9px;color:#999'>$eventId</td>\n";
  }
  echo "</tr>\n";

  foreach( $comps as $comp ){
    extract( $comp );
    $name = htmlEscape( $name );
    $personId = htmlEscape( $personId );

    if( $dataError["reg${id}countryId"] ) echo "<tr style='background-color:#FF3333'>";
    else if( $status == 'p' ) echo "<tr style='background-color:#FFCCCC'>";
    else if( $status == 'a' ) echo "<tr style='background-color:#CCFFCC'>";
    echo "  <td><input type='checkbox' id='reg${id}accept' name='reg${id}accept' value='1' /></td>\n";
    echo "  <td><input type='checkbox' id='reg${id}delete' name='reg${id}delete' value='1' /></td>\n";
    echo "  <td><input type='checkbox' id='reg${id}edit' name='reg${id}edit' value='1' /></td>\n";
    echo "  <td><input type='text' id='reg${id}personId' name='reg${id}personId' value='$personId' size='10' maxlength='10' /></td>\n";
    echo "  <td><input type='text' id='reg${id}name' name='reg${id}name' value='$name' size='25' /></td>\n";
    echo "  <td><input type='text' id='reg${id}countryId' name='reg${id}countryId' value='$countryId' size='15' /></td>\n";    

    foreach( getEventSpecsEventIds( $data['eventSpecs'] ) as $eventId ){
      switch ($comp["E$eventId"]) {
        case 0: echo "  <td><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' /></td>\n"; break;
        case 1: echo "  <td><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' checked='checked' /></td>\n"; break;
        default:echo "  <td style='background-color:#FFCCCC'><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' checked='checked' /></td>\n"; break;
      }
    }
    echo "</tr>\n";
  }
  echo "</table>\n";

  echo "<ul><li><p>See <a href='registration_information.php?competitionId=$chosenCompetitionId&amp;password=$data[password]'>extra registration information</a></p></li>\n"; 
  echo "<li><p>Download the <a href='registration_sheet.php?competitionId=$chosenCompetitionId&amp;password=$data[password]'>registration excel sheet</a> in .csv format.</p></li>\n"; 
  echo "<li><p>Generate the complete <a href='registration_set_spreadsheet.php?competitionId=$chosenCompetitionId&amp;password=$data[password]'>registration excel sheet</a> in .xlsx format.</p></li>\n"; 
  echo "<li><p>If you want to include the <b>form</b> in your website, use an iframe with <a href='http://www.worldcubeassociation.org/results/competition_registration.php?competitionId=$chosenCompetitionId'>this link</a></p></li>\n"; 
  echo "<li><p>If you want to include the <b>list</b> in your website, use an iframe with <a href='http://www.worldcubeassociation.org/results/competition_registration.php?competitionId=$chosenCompetitionId&amp;list=1'>this link</a></p></li></ul>\n"; 

}

#----------------------------------------------------------------------
function endForm () {
#----------------------------------------------------------------------

  echo "<table border='0' cellspacing='10' cellpadding='5' width='10'><tr>\n";
  echo "<td style='background-color:#33FF33'><input id='submit' name='submit' type='submit' value='Submit' /></td>\n";
  echo "<td style='background-color:#FF0000'><input type='reset' value='Reset' /></td>\n";
  echo "</tr></table>\n";
  
  echo "</form>";
}

?>
