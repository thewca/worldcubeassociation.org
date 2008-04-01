<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '_header.php' );

analyzeChoices();
offerChoices();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenType, $chosenText, $chosenUri;
  global $chosenSubmitterName, $chosenSubmitterEmail, $chosenSubmitterComment;

  $chosenCompetitionId   = getNormalParam( 'competitionId'    );
  $chosenType            = getNormalParam( 'type'             );
  $chosenText            = getMysqlParam(  'text'             );
  $chosenUri             = getMysqlParam(  'uri'              );
  $chosenSumitterName    = getMysqlParam(  'submitterName'    );
  $chosenSumitterEmail   = getMysqlParam(  'submitterEmail'   );
  $chosenSumitterComment = getMysqlParam(  'submitterComment' );

}


#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenUri;


  if ($chosenUri != '') {
    saveMedium();
	 echo "Thanks for sending us a link to competition media";
    return; 
  } 
  echo "<p>All media will be reviewed before listed on the Media page</p>";
  echo "<form method='POST' action='$_SERVER[PHP_SELF]'>\n";
  echo "<table border='0' cellspacing='0' cellpadding='2' width='100%'>\n";

  echo "<tr><td>Competition</td>";
  $optionsComp = "<td><select class='drop' id='competitionId' name='competitionId'>\n";
  foreach( getAllCompetitions() as $competition ) {
    $optionId = $competition['id'];
	 $optionName = $competition['cellName'];
    $optionsComp .= "<option value='$optionId'>$optionName</option>\n";
  }
  $optionsComp .= "</select></td></tr>";
  
  echo $optionsComp;

  
  echo "<tr><td>Type</td>";
  echo "<td><select class='drop' id='type' name='type'>\n";
  foreach (array('article', 'report', 'multimedia') as $typeString)
    echo "<option value='$typeString'>$typeString</option>";


  $fieldList = array (
    array ('Text', 'text', ''),
    array ('Link', 'uri', 'http://'),
    array ('Submitter Name', 'submitterName', ''),
    array ('Submitter Email', 'submitterEmail', ''),
    array ('Submitter Comment', 'submitterComment', '')
  );


  foreach ($fieldList as $field) {
    list($title, $name, $value) = $field;
    echo "<tr><td>$title</td><td><input type='text' name='$name' value='$value' /></td></tr>\n";
  }

  echo "</table>";

  echo "<input type='submit' class='butt' value='Save' />";

  echo "</form>";

}


#----------------------------------------------------------------------
function saveMedium () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenType, $chosenText, $chosenUri;
  global $chosenSubmitterName, $chosenSubmitterEmail, $chosenSubmitterComment;

  $command = "
  INSERT INTO CompetitionsMedia
      (competitionId, type, text, uri, submitterName, submitterEmail, submitterComment, status)
    VALUES
	   ('$chosenCompetitionId', '$chosenType', '$chosenText', '$chosenUri',
		 '$chosenSubmitterName', '$chosenSubmitterEmail', '$chosenSubmitterComment', 'pending')";

  dbCommand( $command );
}

?>
