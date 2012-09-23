<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require_once('thirdparty/recaptchalib.php');
$currentSection = 'media';
require( '_header.php' );

analyzeChoices();
offerChoices();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenType, $chosenText, $chosenUri;
  global $chosenSubmitterName, $chosenSubmitterEmail, $chosenSubmitterComment;
  global $chosenTextHtml, $chosenUriHtml, $chosenSubmitterNameHtml, $chosenSubmitterEmailHtml, $chosenSubmitterCommentHtml;
  global $chosenRecaptchaChallenge, $chosenRecaptchaResponse;

  $chosenCompetitionId    = getNormalParam( 'competitionId'    );
  $chosenType             = getNormalParam( 'type'             );
  $chosenText             = getMysqlParam(  'text'             );
  $chosenUri              = getMysqlParam(  'uri'              );
  $chosenSubmitterName    = getMysqlParam(  'submitterName'    );
  $chosenSubmitterEmail   = getMysqlParam(  'submitterEmail'   );
  $chosenSubmitterComment = getMysqlParam(  'submitterComment' );

  $chosenTextHtml             = getHtmlParam(  'text'             );
  $chosenUriHtml              = getHtmlParam(  'uri'              );
  $chosenSubmitterNameHtml    = getHtmlParam(  'submitterName'    );
  $chosenSubmitterEmailHtml   = getHtmlParam(  'submitterEmail'   );
  $chosenSubmitterCommentHtml = getHtmlParam(  'submitterComment' );

  $chosenRecaptchaChallenge = getRawParamThisShouldBeAnException( 'recaptcha_challenge_field' );
  $chosenRecaptchaResponse = getRawParamThisShouldBeAnException( 'recaptcha_response_field' );

}


#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenUri;
  global $chosenCompetitionId, $chosenType;
  global $chosenTextHtml, $chosenUriHtml, $chosenSubmitterNameHtml, $chosenSubmitterEmailHtml, $chosenSubmitterCommentHtml;

  if ($chosenUri != '') {
    $success = saveMedium();
    noticeBox2( $success, 'Thanks for sending us a link to competition media', 'The reCAPTCHA was not entered correctly. Try it again.' );
  } 
  echo "<p>All media will be reviewed before listed on the Media page</p>";
  echo "<form method='POST' action=''>\n";
  echo "<table border='0' cellspacing='0' cellpadding='2' width='100%'>\n";

  echo "<tr><td>Competition</td>";
  $optionsComp = "<td><select class='drop' id='competitionId' name='competitionId'>\n";
  foreach( getAllCompetitions() as $competition ) {
    $optionId = $competition['id'];
    $optionName = $competition['cellName'];
    if( $optionId == $chosenCompetitionId )
      $optionsComp .= "<option value='$optionId' selected='selected'>$optionName</option>\n";
    else
      $optionsComp .= "<option value='$optionId'>$optionName</option>\n";
  }
  $optionsComp .= "</select></td></tr>";
  
  echo $optionsComp;

  
  echo "<tr><td>Type</td>";
  echo "<td><select class='drop' id='type' name='type'>\n";
  foreach (array('article', 'report', 'multimedia') as $typeString)
    if( $typeString == $chosenType )
      echo "<option value='$typeString' selected='selected'>$typeString</option>";
    else
      echo "<option value='$typeString'>$typeString</option>";


  $fieldList = array (
    array ('Text', 'text', $chosenTextHtml),
    array ('Link', 'uri', $chosenUriHtml ? "$chosenUriHtml" : 'http://'),
    array ('Submitter Name', 'submitterName', $chosenSubmitterNameHtml),
    array ('Submitter Email', 'submitterEmail', $chosenSubmitterEmailHtml),
    array ('Submitter Comment', 'submitterComment', $chosenSubmitterCommentHtml)
  );


  foreach ($fieldList as $field) {
    list($title, $name, $value) = $field;
    echo "<tr><td>$title</td><td><input type='text' name='$name' value='$value' /></td></tr>\n";
  }

  echo "</table>";

  global $recaptchaPublickey;
  echo recaptcha_get_html($recaptchaPublickey);

  echo "<input type='submit' class='butt' value='Save' />";

  echo "</form>";

}


#----------------------------------------------------------------------
function saveMedium () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenType, $chosenText, $chosenUri;
  global $chosenSubmitterName, $chosenSubmitterEmail, $chosenSubmitterComment;
  global $chosenRecaptchaChallenge, $chosenRecaptchaResponse;

  global $recaptchaPrivatekey;
  $resp = recaptcha_check_answer ($recaptchaPrivatekey, $_SERVER["REMOTE_ADDR"], $chosenRecaptchaChallenge, $chosenRecaptchaResponse);

  if (!$resp->is_valid)
    return false;
  else {
    $command = "
    INSERT INTO CompetitionsMedia
        (competitionId, type, text, uri, submitterName, submitterEmail, submitterComment, status)
      VALUES
        ('$chosenCompetitionId', '$chosenType', '$chosenText', '$chosenUri',
         '$chosenSubmitterName', '$chosenSubmitterEmail', '$chosenSubmitterComment', 'pending')";

    dbCommand( $command );
    return true;
  }
}

?>
