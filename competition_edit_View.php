<?php

#----------------------------------------------------------------------
function showView () {
#----------------------------------------------------------------------

  showSaveMessage();
  showIntroduction();
  startForm();
  showRegularFields();
  showEventSpecifications();
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

  echo "<p>Enter the data of the competition, then click the submit button on the bottom of the page to update the data in the database. You can turn a text part into a link using this format:<br />[{text...}{http:...}] or [{text...}{mailto:...}]</p>";
}

#----------------------------------------------------------------------
function startForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;
    
  echo "<form method='POST' action='competition_edit.php'>";
  echo "<input id='competitionId' name='competitionId' type='hidden' value='$chosenCompetitionId' />";
  echo "<input id='password' name='password' type='hidden' value='$chosenPassword' />";
}

#----------------------------------------------------------------------
function showRegularFields () {
#----------------------------------------------------------------------
  global $data, $dataError, $modelSpecs;
  
  echo "<table border='0' cellspacing='0' cellpadding='2' width='100%'>";
  
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
    echo "<tr bgcolor='$color'>";
    echo "<td><b style='white-space:nowrap'>$label</b></td>";
    echo "<td>$inputHtml</td>";
    echo "</tr>";

    #--- Show description.
    echo "<tr bgcolor='#EEEEEE'>";
#    echo "<td colspan='2' bgcolor='#EEEEEE'>$description</td>";
    echo "<td>Description</td>";
    echo "<td>$description</td>";
    echo "</tr>";
  
    #--- Show example.
    echo "<tr>";
    echo "<td>Example</td>";
    echo "<td>$example</td>";
    echo "</tr>";
  
    #--- Empty line.
    echo "<tr>";
    echo "<td colspan='2'>&nbsp;</td>";
    echo "</tr>";
  }

  #--- Finish the table.
  echo "</table>\n\n";
}

#----------------------------------------------------------------------
function showEventSpecifications () {
#----------------------------------------------------------------------
  global $data;

  #--- Explain.
  echo "<ul>";
  echo "<li><p>Choose which events the competition will offer.</p></li>";
  echo "<li><p>If you want to limit the number of competitors in an event, enter a number in the 'Competitors' field.</p></li>";
  echo "<li><p>If you want to specify a time limit for an event, enter it in minutes like <b>2:30</b> or <b>90</b> in the 'Time' field.</p></li>";
  echo "</ul>";
  
  #--- Start the table.
  echo "<table border='1' cellspacing='0' cellpadding='4'>";
  echo "<tr bgcolor='#CCCCFF'><td>Event</td><td>Offer</td><td>Competitors</td><td>Time</td></tr>";
  
  #--- Get the existing specs.
  $eventSpecs = $data['eventSpecs'];
 
  #--- List the events.
  foreach( getAllEvents() as $event ){
    extract( $event );

    $offer       = $data["offer$id"] ? "checked='checked'" : "";
    $personLimit = $data["personLimit$id"];
    $timeLimit   = $data["timeLimit$id"];
    
    echo "<tr>";
    echo "<td><b>$cellName</b></td>";
    echo "<td align='center'><input id='offer$id' name='offer$id' type='checkbox' $offer /></td>";
    echo "<td align='center'><input id='personLimit$id' name='personLimit$id' type='text' size='6' style='background:#FF8' value='$personLimit' /></td>";
    echo "<td align='center'><input id='timeLimit$id' name='timeLimit$id' type='text' size='6' style='background:#FF8' value='$timeLimit' /></td>";
    echo "</tr>";
  }
  
  #--- Finish the table.
  echo "</table>";
}

#----------------------------------------------------------------------
function endForm () {
#----------------------------------------------------------------------

  echo "<center><table border='0' cellspacing='10' cellpadding='5' width='10'><tr>";
  echo "<td bgcolor='#33FF33'><input id='submit' name='submit' type='submit' value='Submit' /></td>";
  echo "<td bgcolor='#FF0000'><input type='reset' value='Reset' /></td>";
  echo "</tr></table></center>";
  
  echo "</form>";
}

?>
