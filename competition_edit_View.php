<?php

#----------------------------------------------------------------------
function showView () {
#----------------------------------------------------------------------

  showSaveMessage();
  showIntroduction();
  startForm();
  showRegularFields();
  showEventSpecifications();
  showAdminOptions();
  showRegs();
  showMap();
  endForm();
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
function showIntroduction () {
#----------------------------------------------------------------------

  echo "<h1>General information</h1>";
  echo "<p>Enter the data of the competition, then click the submit button on the bottom of the page to update the data in the database. You can turn a text part into a link using this format:<br />[{text...}{http:...}] or [{text...}{mailto:...}]</p>\n\n";
}

#----------------------------------------------------------------------
function startForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;
    
  echo "<form method='POST' action='competition_edit.php?competitionId=$chosenCompetitionId&password=$chosenPassword&rand=" . rand() . "'>\n";
}

#----------------------------------------------------------------------
function showRegularFields () {
#----------------------------------------------------------------------
  global $data, $dataError, $modelSpecs;
  
  echo "<table border='0' cellspacing='0' cellpadding='2' width='100%'>\n";
  
  #--- Show the fields.
  foreach( $modelSpecs as $fieldSpec ){
  
    #--- Extract the field specification.
    list( $type, $id, $label, $description, $example, $pattern, $extra ) = $fieldSpec;

    #--- Build the input HTML.
    if( $type == "line" ){
      $value = htmlEscape( $data[$id] );
      $inputHtml = "<input id='$id' name='$id' type='text' size='110' style='background:#FF8' value='$value' />";
    }
    if( $type == "text" ){
      $value = htmlEscape( $data[$id] );
      $inputHtml = "<textarea id='$id' name='$id' cols='110' rows='3' style='background:#FF8;font-family:Arial,Helvetica'>$value</textarea>";
    }
    if( $type == "choice" ){
      $value = htmlEscape( $data[$id] );
      $inputHtml = "<select id='$id' name='$id' style='background:#FF8'>";
      foreach( $extra as $option ){
        $selected = ($option['id'] == $value) ? "selected='selected'" : "";
        $inputHtml .= "<option value='$option[id]' $selected>$option[name]</option>";
      }
      $inputHtml .= "</select>";
    }

    #--- Color: blue for ok, red for errors.
    $color = $dataError[$id] ? '#FF3333' : '#CCCCFF';
     
    #--- Show label and input field.        
    echo "<tr bgcolor='$color'>\n";
    echo "  <td><b style='white-space:nowrap'>$label</b></td>\n";
    echo "  <td>$inputHtml</td>\n";
    echo "</tr>\n\n";

    #--- Show description.
    echo "<tr bgcolor='#EEEEEE'>\n";
#    echo "<td colspan='2' bgcolor='#EEEEEE'>$description</td>";
    echo "  <td>Description</td>\n";
    echo "  <td>$description</td>\n";
    echo "</tr>\n\n";
  
    #--- Show example.
    echo "<tr>\n";
    echo "  <td>Example</td>\n";
    echo "  <td>$example</td>\n";
    echo "</tr>\n\n";
  
    #--- Empty line.
    echo "<tr>\n";
    echo "  <td colspan='2'>&nbsp;</td>\n";
    echo "</tr>\n\n";
  }

  #--- Finish the table.
  echo "</table>\n\n";
}

#----------------------------------------------------------------------
function showEventSpecifications () {
#----------------------------------------------------------------------
  global $data;

  echo "<hr><h1>Events</h1>";
  #--- Explain.
  echo "<ul>";
  echo "<li><p>Choose which events the competition will offer.</p></li>\n";
  echo "<li><p>If you want to limit the number of competitors in an event, enter a number in the 'Competitors' field.</p></li>\n";
  echo "<li><p>If you want to specify a time limit for an event, enter it in minutes like <b>2:30</b> or <b>90</b> in the 'Time' field.</p></li>\n";
  echo "</ul>\n\n";
  
  #--- Start the table.
  echo "<table border='1' cellspacing='0' cellpadding='4'>";
  echo "<tr bgcolor='#CCCCFF'><td>Event</td><td>Offer</td><td>Competitors</td><td>Time</td></tr>\n";
  
  #--- Get the existing specs.
  $eventSpecs = $data['eventSpecs'];
 
  #--- List the events.
  foreach( getAllEvents() as $event ){
    extract( $event );

    $offer       = $data["offer$id"] ? "checked='checked'" : "";
    $personLimit = $data["personLimit$id"];
    $timeLimit   = $data["timeLimit$id"];
    
    echo "<tr>\n";
    echo "  <td><b>$cellName</b></td>\n";
    echo "  <td align='center'><input id='offer$id' name='offer$id' type='checkbox' $offer /></td>\n";
    echo "  <td align='center'><input id='personLimit$id' name='personLimit$id' type='text' size='6' style='background:#FF8' value='$personLimit' /></td>\n";
    echo "  <td align='center'><input id='timeLimit$id' name='timeLimit$id' type='text' size='6' style='background:#FF8' value='$timeLimit' /></td>\n";
    echo "</tr>\n";
  }
  
  #--- List the unofficial events.
  foreach( getAllUnofficialEvents() as $event ){
    extract( $event );

    $offer       = $data["offer$id"] ? "checked='checked'" : "";
    $personLimit = $data["personLimit$id"];
    $timeLimit   = $data["timeLimit$id"];
    
    echo "<tr>\n";
    echo "  <td><b style='color:#999'>$cellName</b></td>\n";
    echo "  <td align='center'><input id='offer$id' name='offer$id' type='checkbox' $offer /></td>\n";
    echo "  <td align='center'><input id='personLimit$id' name='personLimit$id' type='text' size='6' style='background:#FF8' value='$personLimit' /></td>\n";
    echo "  <td align='center'><input id='timeLimit$id' name='timeLimit$id' type='text' size='6' style='background:#FF8' value='$timeLimit' /></td>\n";
    echo "</tr>\n";
  }
  
  #--- Finish the table.
  echo "</table>\n";
}

#----------------------------------------------------------------------
function showAdminOptions () {
#----------------------------------------------------------------------
  global $data, $chosenCompetitionId;

  $fullEdit = getNormalParam( 'FULLEDIT' );
  if( $fullEdit == '7247' ){
    $results = dbQuery( "SELECT * FROM Results WHERE competitionId='$chosenCompetitionId'" );

	 echo "<input id='FULLEDIT' name='FULLEDIT' type='hidden' value='7247' />\n";

    if( $data["showAtAll"] )
      echo "<p><input id='showAtAll' name='showAtAll' type='checkbox' checked='checked' /> Check if you want the <b>Competition</b> to be visible</p>\n";
    else
      echo "<p><input id='showAtAll' name='showAtAll' type='checkbox' /> Check if you want the <b>Competition</b> to be visible</p>\n";

    if( count( $results )){
      if( $data["showResults"] )
        echo "<p><input id='showResults' name='showResults' type='checkbox' checked='checked' /> Check if you want the <b>Results</b> to be visible</p>\n";
      else
        echo "<p><input id='showResults' name='showResults' type='checkbox' /> Check if you want the <b>Results</b> to be visible</p>\n";
    }
  }

  else{
    if( $data["showAtAll"] )
      echo "<input id='showAtAll' name='showAtAll' type='hidden' value='ok' />\n";
    if( $data["showResults"] )
      echo "<input id='showResults' name='showResults' type='hidden' value='ok' />\n";
  }

}

#----------------------------------------------------------------------
function showRegs () {
#----------------------------------------------------------------------
  global $data, $chosenCompetitionId;

  echo "<hr><h1>Registration</h1>";

  if( $data["showPreregForm"] )
    echo "<p><input id='showPreregForm' name='showPreregForm' type='checkbox' checked='checked' /> Check if you want to start a <b>Registration Form</b></p>\n";
  else
    echo "<p><input id='showPreregForm' name='showPreregForm' type='checkbox' /> Check if you want to start a <b>Registration Form</b></p>\n";

  if( $data["showPreregList"] )
    echo "<p><input id='showPreregList' name='showPreregList' type='checkbox' checked='checked' /> Check if you want the <b>Registered Competitors</b> to be visible</p>\n";
  else
    echo "<p><input id='showPreregList' name='showPreregList' type='checkbox' /> Check if you want the <b>Registered Competitors</b> to be visible</p>\n";


  $comps = dbQuery( "SELECT * FROM Preregs WHERE competitionId='$chosenCompetitionId'" );
  
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

    if( $status == 'p' ) echo "<tr bgcolor='#FFCCCC'>";
	 else if ($status == 'a' ) echo "<tr bgcolor='#CCFFCC'>";
    echo "  <td><input type='checkbox' id='reg${id}accept' name='reg${id}accept' value='1' /></td>\n";
    echo "  <td><input type='checkbox' id='reg${id}delete' name='reg${id}delete' value='1' /></td>\n";
    echo "  <td><input type='checkbox' id='reg${id}edit' name='reg${id}edit' value='1' /></td>\n";
    echo "  <td><input type='text' id='reg${id}personId' name='reg${id}personId' value='$personId' size='10' maxlength='10' /></td>\n";
    echo "  <td><input type='text' id='reg${id}name' name='reg${id}name' value='$name' size='25' /></td>\n";
    
    echo "  <td><select id='reg${id}countryId' name='reg${id}countryId'>";
    foreach( dbQuery( "SELECT * FROM Countries" ) as $country ){
      $cId   = $country['id'  ];
      $cName = $country['name'];
      if( $cId == $countryId )
        echo "    <option value=\"$cId\" selected='selected' >$cName</option>\n";
      else
        echo "    <option value=\"$cId\">$cName</option>\n";
    }
    echo "  </select></td>";

    foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event ){
      $eventId = $event['id'];
      if( $data["offer$eventId"] ){
        if( $comp["E$eventId"] )
          echo "  <td><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' checked='checked' /></td>\n";
        else
          echo "  <td><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' /></td>\n";
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
