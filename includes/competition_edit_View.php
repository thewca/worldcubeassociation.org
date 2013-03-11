<?php

#----------------------------------------------------------------------
function showView () {
#----------------------------------------------------------------------
  global $isAdmin, $isConfirmed;

  showSaveMessage();
  startForm();
  if( $isAdmin ){
    showAdminOptions();
    showAnnouncement();
  }
  if( $isAdmin || (! $isConfirmed )){
    showRegularFields();
    showEventSpecifications();
  }
  showRegs();
  showRegsOptions();
  if( $isAdmin || (! $isConfirmed )){
    showMap();
  }
  endForm();
}

#----------------------------------------------------------------------
function showSaveMessage () {
#----------------------------------------------------------------------
  global $chosenSubmit, $chosenConfirm, $dataSuccessfullySaved;
  
  #--- If no submit, don't say anything.
  if( ! $chosenSubmit )
    return;
  
  #--- Report success or error.
  if( $chosenConfirm ){
    noticeBox2( $dataSuccessfullySaved,
      "The competition has been validated.",
      "The competition has not been validated. See red fields below for invalid data."
    );
  } else {
    noticeBox2( $dataSuccessfullySaved,
      "Data was successfully saved.",
      "Data wasn't saved. See red fields below for invalid data."
    );
  }
}

#----------------------------------------------------------------------
function startForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;
    
  echo "<form method='post' enctype='multipart/form-data' action='competition_edit.php?competitionId=$chosenCompetitionId&amp;password=$chosenPassword&amp;rand=" . rand() . "'>\n";
}

#----------------------------------------------------------------------
function showRegularFields () {
#----------------------------------------------------------------------
  global $data, $dataError, $modelSpecs;
  
  echo "<h1>General information</h1>";
  echo "<p>Enter the data of the competition, then click the submit button on the bottom of the page to update the data in the database. You can turn a text part into a link using this format:<br />[{text...}{http:...}] or [{text...}{mailto:...}]</p>\n\n";

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
        $inputHtml .= "<option value=\"$option[id]\" $selected>$option[name]</option>";
      }
      $inputHtml .= "</select>";
    }

    #--- Color: blue for ok, red for errors.
    $color = $dataError[$id] ? '#FF3333' : '#CCCCFF';
     
    #--- Show label and input field.        
    echo "<tr style='background:$color'>\n";
    echo "  <td><b style='white-space:nowrap'>$label</b></td>\n";
    echo "  <td>$inputHtml</td>\n";
    echo "</tr>\n\n";

    #--- Show description.
    echo "<tr style='background:#EEE'>\n";
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
  global $data, $chosenCompetitionId;

  echo "<hr /><h1>Events</h1>";
  #--- Explain.
  echo "<ul>";
  echo "<li><p>Choose which events the competition will offer.</p></li>\n";
  //echo "<li><p>If you want to limit the number of competitors in an event, enter a number in the 'Competitors' field, and after reaching the limit, every following registration will be marked 'w' (waiting list)</p></li>\n";
  /*echo "<li><p>If you want to specify a time limit for an event, enter the number of hundredth of seconds for a time, the result for FM or the number of cubes solved for multi in the 'Time' field. Every competitor that doesn't fit the time limit will be marked 'w'.</p></li>\n";
  echo "<li><p>You also need to specify if you want the limit to be applied on the best single or on the best average (if available).</p></li>\n";
  echo "<li><p>If you have qualifications for an event, you can check the Qualifications checkbox and enter a Qualifications Time Limit. Competitors who fit this time limit but not the main time limit will have a 'q', others get a 'w'.</p></li>\n";
  echo "<li><p>To run the computation of the waiting list, click <a href='compute_waiting_list.php?id=$chosenCompetitionId'>here</a></p></li>\n";*/
  echo "</ul>\n\n";
  
  #--- Start the table.
  echo "<table border='1' cellspacing='0' cellpadding='4'>";
  //echo "<tr style='background:#CCCCFF'><td>Event</td><td>Offer</td><td>Competitors</td><td>Time</td><td>Single</td><td>Average</td><td>Qualifications</td><td>Qualifications Time</td></tr>\n";
  echo "<tr style='background:#CCCCFF'><td>Event</td><td>Offer</td></tr>\n";
  
  #--- Get the existing specs.
  $eventSpecs = $data['eventSpecs'];
 
  #--- List the events.
  foreach( getAllEvents() as $event ){
    extract( $event );

    $offer            = isset($data["offer$id"]) ? "checked='checked'" : "";
    /*
    $personLimit      = $data["personLimit$id"];
    $timeLimit        = $data["timeLimit$id"];
    $timeSingle       = $data["timeFormat$id"] ==  's' ? "checked='checked'" : "";
    $timeAverage      = $data["timeFormat$id"] ==  'a' ? "checked='checked'" : "";
    $qualify          = $data["qualify$id"] ? "checked='checked'" : "";
    $qualifyTimeLimit = $data["qualifyTimeLimit$id"];
    */
    
    echo "<tr>\n";
    echo "  <td><b>$cellName</b></td>\n";
    echo "  <td align='center'><input id='offer$id' name='offer$id' type='checkbox' $offer /></td>\n";
    /*
    echo "  <td align='center'><input id='personLimit$id' name='personLimit$id' type='text' size='6' style='background:#FF8' value='$personLimit' /></td>\n";
    echo "  <td align='center'><input id='timeLimit$id' name='timeLimit$id' type='text' size='6' style='background:#FF8' value='$timeLimit' /></td>\n";
    echo "  <td align='center'><input id='timeFormatSingle$id' name='timeFormat$id' type='radio' value='s' $timeSingle /></td>\n";
    if( count( dbQuery( "SELECT * FROM RanksAverage WHERE eventId='$id' LIMIT 1" )))
      echo "  <td align='center'><input id='timeFormatAverage$id' name='timeFormat$id' type='radio' value='a' $timeAverage /></td>\n"; # TODO: Nasty...
    else
      echo "  <td></td>\n";
    echo "  <td align='center'><input id='qualify$id' name='qualify$id' type='checkbox' $qualify /></td>\n";
    echo "  <td align='center'><input id='qualifyTimeLimit$id' name='qualifyTimeLimit$id' type='text' size='6' style='background:#FF8' value='$qualifyTimeLimit' /></td>\n";
    */
    echo "</tr>\n";
  }
  
  #--- Finish the table.
  echo "</table>\n";
}

#----------------------------------------------------------------------
function showAdminOptions () {
#----------------------------------------------------------------------
  global $data, $chosenCompetitionId, $isConfirmed;

  echo "<p>You can give this link to an organiser or a delegate to manage a competition: <br />
http://www.worldcubeassociation.org/results/competition_edit.php?competitionId=$chosenCompetitionId&password=$data[organiserPassword]</p>";

  echo "<p><input type='hidden' name='organiserPassword' id='organiserPassword' value='$data[organiserPassword]' /></p>\n";

  if( $isConfirmed ){
    echo "<p>The competition has been <span style='color:#3C3'>validated</span> by the organisers/delegate</p>";
    echo "<p><input id='unvalidate' name='unvalidate' type='checkbox' /> Check if you want to <b>unvalidate</b> so that organisers can change again some informations.</p>\n";
  }
  else
    echo "<p>The competition is currently <span style='color:#F00'>not validated</span> by the organisers/delegate</p>";

  echo "<p>If you agree with all the informations, you can simply change the competition's state to visible, which is now by default not the case.</p>";

  if( $data["showAtAll"] )
    echo "<p><input id='showAtAll' name='showAtAll' type='checkbox' checked='checked' /> Check if you want the <b>Competition</b> to be visible</p>\n";
  else
    echo "<p><input id='showAtAll' name='showAtAll' type='checkbox' /> Check if you want the <b>Competition</b> to be visible</p>\n";

}

#----------------------------------------------------------------------
function showRegsOptions () {
#----------------------------------------------------------------------
  global $data, $dataError, $chosenCompetitionId;

  if( $data["showPreregForm"] )
    echo "<p><input id='showPreregForm' name='showPreregForm' type='checkbox' checked='checked' /> Check if you want to start a <b>Registration Form</b></p>\n";
  else
    echo "<p><input id='showPreregForm' name='showPreregForm' type='checkbox' /> Check if you want to start a <b>Registration Form</b></p>\n";

  if( $data["showPreregList"] )
    echo "<p><input id='showPreregList' name='showPreregList' type='checkbox' checked='checked' /> Check if you want the <b>Registered Competitors</b> to be visible</p>\n";
  else
    echo "<p><input id='showPreregList' name='showPreregList' type='checkbox' /> Check if you want the <b>Registered Competitors</b> to be visible</p>\n";

}

#----------------------------------------------------------------------
function showRegs () {
#----------------------------------------------------------------------
  global $data, $dataError, $chosenCompetitionId, $chosenPassword;

  echo "<hr />\n";
  echo "<h1>Registration</h1>";

  echo "<p><input type='hidden' name='eventSpecs' id='eventSpecs' value='$data[eventSpecs]' /></p>\n";

  $comps = dbQuery( "SELECT * FROM Preregs WHERE competitionId='$chosenCompetitionId' ORDER BY id" );

  if( ! count( $comps)){
    echo "Nobody registered yet.";
    return;
  }

  #--- Start the table.
  echo "<h4>Registered Competitors</h4>\n";
  echo "<ul><li><p>A : Accept, D : Delete, E : Edit.</p></li>\n";
  echo "<li><p>Pending registrations are in light red, accepted registrations are in light green.</p></li>\n";
  echo "<li><p>If you want to edit a person, first check its 'edit' checkbox for this to work.</p></li></ul>\n";
  
  echo "<table border='1' cellspacing='0' cellpadding='4'>\n";
  echo "<tr style='background-color:#CCCCFF'><td>A</td><td>D</td><td>E</td><td>WCA Id</td><td>Name</td><td>Country</td>\n";
  foreach( getEventSpecsEventIds( $data['eventSpecs'] ) as $eventId ){
    echo "<td style='font-size:9px'>$eventId</td>\n";
  }
  echo "</tr>\n";

  foreach( $comps as $comp ){
    extract( $comp );
    $name = htmlEscape( $name );
    $personId = htmlEscape( $personId );
    $eventIdsList = array_flip( explode( ' ', $eventIds ));

    if( $dataError["reg${id}countryId"] ) echo "<tr style='background-color:#FF3333'>\n";
    else if( $status == 'p' ) echo "<tr style='background-color:#FFCCCC'>\n";
    else if( $status == 'a' ) echo "<tr style='background-color:#CCFFCC'>\n";
    echo "  <td><input type='checkbox' id='reg${id}accept' name='reg[${id}][accept]' value='1' /></td>\n";
    echo "  <td><input type='checkbox' id='reg${id}delete' name='reg[${id}][delete]' value='1' /></td>\n";
    echo "  <td><input type='checkbox' id='reg${id}edit' name='reg[${id}][edit]' value='1' /></td>\n";
    echo "  <td><input type='text' id='reg${id}personId' name='reg[${id}][personId]' value='$personId' size='10' maxlength='10' /></td>\n";
    echo "  <td><input type='text' id='reg${id}name' name='reg[${id}][name]' value='$name' size='25' /></td>\n";
    echo "  <td><input type='text' id='reg${id}countryId' name='reg[${id}][countryId]' value='$countryId' size='15' /></td>\n";    

    foreach( getEventSpecsEventIds( $data['eventSpecs'] ) as $eventId ){
      if( isset( $eventIdsList[$eventId]))
        echo "  <td><input type='checkbox' id='reg${id}E$eventId' name='reg[${id}][E$eventId]' value='1' checked='checked' /></td>\n";
      else
        echo "  <td><input type='checkbox' id='reg${id}E$eventId' name='reg[${id}][E$eventId]' value='1' /></td>\n";
        /* default:echo "  <td style='background-color:#FFCCCC'><input type='checkbox' id='reg${id}E$eventId' name='reg${id}E$eventId' value='1' checked='checked' /></td>\n"; break; */
    }
    echo "</tr>\n";
  }
  echo "</table>\n";

  echo "<ul><li><p>See <a href='registration_information.php?competitionId=$chosenCompetitionId&amp;password=$chosenPassword'>extra registration information</a></p></li>\n"; 
  echo "<li><p>Download the <a href='registration_sheet.php?competitionId=$chosenCompetitionId&amp;password=$chosenPassword'>registration excel sheet</a> in .csv format.</p></li>\n"; 
  echo "<li><p>Generate the complete <a href='registration_set_spreadsheet.php?competitionId=$chosenCompetitionId&amp;password=$chosenPassword'>registration excel sheet</a> in .xlsx format.</p></li>\n"; 
  echo "<li><p>If you want to include the <b>form</b> in your website, use an iframe with <a href='http://www.worldcubeassociation.org/results/competition_registration.php?competitionId=$chosenCompetitionId'>this link</a></p></li>\n"; 
  echo "<li><p>If you want to include the <b>list</b> in your website, use an iframe with <a href='http://www.worldcubeassociation.org/results/competition_registration.php?competitionId=$chosenCompetitionId&amp;list=1'>this link</a></p></li></ul>\n"; 

}

#----------------------------------------------------------------------
function showMap () {
#----------------------------------------------------------------------
  global $data, $chosenCompetitionId, $chosenPassword;

  echo "<hr /><h1>Map</h1>";

  echo "<p><input type='hidden' name='latitude' id='latitude' value='$data[latitude]' />";
  echo "<input type='hidden' name='longitude' id='longitude' value='$data[longitude]' /></p>";
  echo "<p>Current coordinates are Latitude = " . $data['latitude'] . " and Longitude = " . $data['longitude'] . ".</p>";
  echo "<p><a href='map_coords.php?competitionId=$chosenCompetitionId&password=$chosenPassword'>Change</a> the coordinates.</p>";
}

#----------------------------------------------------------------------
function showAnnouncement() {
#----------------------------------------------------------------------
  global $data, $chosenCompetitionId;

  echo "<hr /><h1>Announcements</h1>";

  echo "<h4>Competition</h4>";

  $months = explode( " ", ". January February March April May June July August September October November December" );
  $date = $months[$data['month']] . ' ' . $data['day'];
  if( $data['endMonth'] != $data['month'] )
    $date .= " - " . $months[$data['endMonth']] . ' ' . $data['endDay'];
  elseif( $data['endDay'] != $data['day'] )
    $date .= "-" . $data['endDay'];

  $msg = "$data[name] on $date, $data[year] in $data[cityName], $data[countryId]\n\n";

  $msg .= "The <a href=\"http://www.worldcubeassociation.org/results/c.php?i=$chosenCompetitionId\">$data[name]</a>";
  $msg .= " will take place on $date, $data[year] in $data[cityName], $data[countryId].";
  if( $data['website'] )
  {
  $websiteAddress = preg_replace( '/\[{ ([^}]+) }{ ([^}]+) }]/x', "$2", $data['website'] );
    $msg .= " Check out the <a href=\"$websiteAddress\">$data[name] website</a> for more information and registration.";
  }
  $msg = htmlEscape( $msg );
  echo "<p><textarea cols='100' rows='6' readonly='readonly'>$msg</textarea></p>";

  
  $competitionResults = dbQuery(" SELECT * FROM Results WHERE competitionId='$chosenCompetitionId' ");

  if( $competitionResults ){
  
    echo "<h4>Results</h4>";

    $top = dbQuery( "SELECT * FROM Results WHERE competitionId='$chosenCompetitionId' AND eventId='333' AND (roundId='f' OR roundId='c') ORDER BY pos LIMIT 3 " );
    if( $top ){ # If there was a 3x3x3 event.
  
      $msg = $top[0]['personName'] . " wins $data[name]\n\n";
 
      $msg .= "<a href=\"http://www.worldcubeassociation.org/results/p.php?i=".$top[0]['personId']."\">".$top[0]['personName']."</a> won the ";
      $msg .= "<a href=\"http://www.worldcubeassociation.org/results/c.php?i=$chosenCompetitionId\">$data[name]</a> with an average of ";
      $msg .= formatValue( $top[0]['average'], 'time' );
      $msg .= " seconds. ";

      $msg .= "<a href=\"http://www.worldcubeassociation.org/results/p.php?i=".$top[1]['personId']."\">".$top[1]['personName']."</a> finished second (";
      $msg .= formatValue( $top[1]['average'], 'time' );
      $msg .= ") and ";

      $msg .= "<a href=\"http://www.worldcubeassociation.org/results/p.php?i=".$top[2]['personId']."\">".$top[2]['personName']."</a> finished third (";
      $msg .= formatValue( $top[2]['average'], 'time' );
      $msg .= ").<br />\n";

    }
 
    else{

      $msg = "Results of $data[name] posted\n\n";
      $msg .= "Results of the <a href=\"http://www.worldcubeassociation.org/results/c.php?i=$chosenCompetitionId\">$data[name]</a> are now available.<br />\n";

    }

    foreach( array( array( 'code' => 'WR',  'name' => 'World' ),
                    array( 'code' => 'AfR', 'name' => 'African' ),
                    array( 'code' => 'AsR', 'name' => 'Asian' ),
                    array( 'code' => 'OcR', 'name' => 'Oceanian' ),
                    array( 'code' => 'ER',  'name' => 'European' ),
                    array( 'code' => 'NAR', 'name' => 'North American' ), 
                    array( 'code' => 'SAR', 'name' => 'South American' )) as $xR ){

      $competitionsRs = dbQuery(" SELECT personName, best, average, regionalSingleRecord, regionalAverageRecord, cellName, format
                                  FROM Results results, Events events
                                  WHERE results.competitionId='$chosenCompetitionId' AND
                                  results.eventId = events.id AND
                                  (regionalSingleRecord='$xR[code]' OR regionalAverageRecord='$xR[code]')
                                  ORDER BY results.personName, events.rank");

      if( $competitionsRs ){
        $msg .= $xR['name'] . " records: ";
        $previousName = "";
        foreach( $competitionsRs as $competitionsR ){
          extract( $competitionsR );

          if( $regionalSingleRecord == $xR['code'] ){ 
            if( ! $previousName )
              $msg .= $personName . ' ' . $cellName . ' ' . formatValue( $best, $format ) . ' (single)';
            else if( $previousName == $personName )
              $msg .= ', ' . $cellName . ' ' . formatValue( $best, $format ) . ' (single)';
            else{
              $msg .= ', ' . $personName . ' ' . $cellName . ' ' . formatValue( $best, $format ) . ' (single)';
            }
            $previousName = $personName;
          }

          if( $regionalAverageRecord == $xR['code'] ){ 
            if( ! $previousName )
              $msg .= $personName . ' ' . $cellName . ' ' . formatValue( $average, $format ) . ' (average)';
            else if( $previousName == $personName )
              $msg .= ', ' . $cellName . ' ' . formatValue( $average, $format ) . ' (average)';
            else{
              $msg .= ', ' . $personName . ' ' . $cellName . ' ' . formatValue( $average, $format ) . ' (average)';
            }
            $previousName = $personName;
          }
        }
      $msg .= ".<br />\n";
      }
    }

    $msg = htmlEscape( $msg );
    echo "<p><textarea cols='100' rows='6' readonly='readonly'>$msg</textarea></p>";
  }
  echo "<hr />\n";
}


#----------------------------------------------------------------------
function endForm () {
#----------------------------------------------------------------------
  global $isAdmin, $isConfirmed;

  echo "<hr />\n";

  if(( ! $isAdmin ) && ( ! $isConfirmed )){
    echo "<p>Click 'Save' if you want to save your current information, without submitting yet to the WCA Board.</p>";
    echo "<p>Click 'Confirm' if you want to validate the competition's details. Please contact the WCA Board afterwards for approval. <span style='font-weight:bold;'>Be careful</span>, you won't be able to modify any information after that. You will still be able moderate the registrations on this page if you choose to use the registration feature.</p>";
  }
  echo "<table border='0' cellspacing='10' cellpadding='5' width='10'><tr>\n";
  echo "<td style='background:#33FF33'><input id='submit' name='submit' type='submit' value='Save' /></td>\n";
  if(( ! $isAdmin ) && ( ! $isConfirmed ))
    echo "<td style='background:#FFFF88'><input id='confirm' name='confirm' type='submit' value='Confirm' /></td>\n";
  echo "<td style='background:#FF0000'><input type='reset' value='Reset' /></td>\n";
  echo "</tr></table>\n";
  
  echo "</form>";
}
