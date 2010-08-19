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
  showAnnouncement();
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
  global $chosenCompetitionId;
    
  echo "<form method='post' action='competition_edit.php?competitionId=$chosenCompetitionId&amp;rand=" . rand() . "'>\n";
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
  echo "<li><p>If you want to specify a time limit for an event, enter the number of hundredth of seconds for a time, the result for FM or the number of cubes solved for multi in the 'Time' field. Every competitor that doesn't fit the time limit will be marked 'w'.</p></li>\n";
  echo "<li><p>You also need to specify if you want the limit to be applied on the best single or on the best average (if available).</p></li>\n";
  echo "<li><p>If you have qualifications for an event, you can check the Qualifications checkbox and enter a Qualifications Time Limit. Competitors who fit this time limit but not the main time limit will have a 'q', others get a 'w'.</p></li>\n";
  echo "<li><p>To run the computation of the waiting list, click <a href='compute_waiting_list.php?id=$chosenCompetitionId'>here</a></p></li>\n";
  echo "</ul>\n\n";
  
  #--- Start the table.
  echo "<table border='1' cellspacing='0' cellpadding='4'>";
  echo "<tr style='background:#CCCCFF'><td>Event</td><td>Offer</td><td>Competitors</td><td>Time</td><td>Single</td><td>Average</td><td>Qualifications</td><td>Qualifications Time</td></tr>\n";
  
  #--- Get the existing specs.
  $eventSpecs = $data['eventSpecs'];
 
  #--- List the events.
  foreach( getAllEvents() as $event ){
    extract( $event );

    $offer            = $data["offer$id"] ? "checked='checked'" : "";
    $personLimit      = $data["personLimit$id"];
    $timeLimit        = $data["timeLimit$id"];
    $timeSingle       = $data["timeFormat$id"] ==  's' ? "checked='checked'" : "";
    $timeAverage      = $data["timeFormat$id"] ==  'a' ? "checked='checked'" : "";
    $qualify          = $data["qualify$id"] ? "checked='checked'" : "";
    $qualifyTimeLimit = $data["qualifyTimeLimit$id"];
    
    echo "<tr>\n";
    echo "  <td><b>$cellName</b></td>\n";
    echo "  <td align='center'><input id='offer$id' name='offer$id' type='checkbox' $offer /></td>\n";
    echo "  <td align='center'><input id='personLimit$id' name='personLimit$id' type='text' size='6' style='background:#FF8' value='$personLimit' /></td>\n";
    echo "  <td align='center'><input id='timeLimit$id' name='timeLimit$id' type='text' size='6' style='background:#FF8' value='$timeLimit' /></td>\n";
    echo "  <td align='center'><input id='timeFormatSingle$id' name='timeFormat$id' type='radio' value='s' $timeSingle /></td>\n";
    if( count( dbQuery( "SELECT * FROM RanksAverage WHERE eventId='$id'" )))
      echo "  <td align='center'><input id='timeFormatAverage$id' name='timeFormat$id' type='radio' value='a' $timeAverage /></td>\n"; # TODO: Nasty...
    else
      echo "  <td></td>\n";
    echo "  <td align='center'><input id='qualify$id' name='qualify$id' type='checkbox' $qualify /></td>\n";
    echo "  <td align='center'><input id='qualifyTimeLimit$id' name='qualifyTimeLimit$id' type='text' size='6' style='background:#FF8' value='$qualifyTimeLimit' /></td>\n";
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

  $results = dbQuery( "SELECT * FROM Results WHERE competitionId='$chosenCompetitionId'" );

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

#----------------------------------------------------------------------
function showAnnouncement() {
#----------------------------------------------------------------------
  global $data, $chosenCompetitionId;

  echo "<hr /><h1>Announcements</h1>";

  echo "<h4>Competition</h4>";

  $months = split( " ", ". January February March April May June July August September October November December" );
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

    //$top = dbQuery( "SELECT * FROM Results WHERE competitionId='$chosenCompetitionId' AND eventId='333' AND (roundId='a' OR roundId='c') ORDER BY pos LIMIT 3 " );
    $top = dbQuery( "SELECT * FROM Results WHERE competitionId='$chosenCompetitionId' AND eventId='333' AND roundId='f' ORDER BY pos LIMIT 0, 3 " );
  
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
 
    foreach( array( array( 'code' => 'WR',  'name' => 'World' ),
                    array( 'code' => 'AfR', 'name' => 'African' ),
                    array( 'code' => 'AsR', 'name' => 'Asian' ),
                    array( 'code' => 'AuR', 'name' => 'Australian' ),
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
}


#----------------------------------------------------------------------
function endForm () {
#----------------------------------------------------------------------

  echo "<table border='0' cellspacing='10' cellpadding='5' width='10'><tr>\n";
  echo "<td style='background:#33FF33'><input id='submit' name='submit' type='submit' value='Submit' /></td>\n";
  echo "<td style='background:#FF0000'><input type='reset' value='Reset' /></td>\n";
  echo "</tr></table>\n";
  
  echo "</form>";
}

?>
