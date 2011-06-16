<?php
#----------------------------------------------------------------------
#   Redirects...
#----------------------------------------------------------------------

handleRedirects();
function handleRedirects () {
  extract( $_REQUEST );

  #--- Fetch competition password if needed
  if( $registration || $edit || $createNew || $clone ){
    ob_start(); require( '../_framework.php' ); ob_end_clean();
    $password = getCompetitionPassword( $competitionId );
  }

  #--- Create new competition (possibly cloning an old one)
  if( $createNew || $clone ){

    #--- Error if that competitionId has wrong syntax
    if( ! preg_match( '/^\w+$/', $newCompetitionId )){
      header( "Location: competitions_manage.php?error=bad" );
      exit;
    }

    #--- Error if that competitionId already exists
    if( count( dbQuery("SELECT * FROM Competitions WHERE id='$newCompetitionId'") ) ){
      header( "Location: competitions_manage.php?error=duplicate" );
      exit;
    }

    #--- Create the new competition.
    ob_start(); require( '_helpers.php' ); ob_end_clean();
    if( $clone )
      cloneNewCompetition( $newCompetitionId, $competitionId );
    else
      createNewCompetition( $newCompetitionId );

    #--- Forward to edit page.
    $competitionId = $newCompetitionId;
    $password = getCompetitionPassword( $competitionId );
    $edit = true;
  }

  #--- Shall we go somewhere?
  if( $registration )
    $goal = "../competition_edit.php?competitionId=$competitionId&password=$password&rand=" . rand();
  if( $edit )
    $goal = "competition_edit.php?competitionId=$competitionId&rand=" . rand();
  if( $results )
    $goal = "../competition.php?competitionId=$competitionId";

  #--- If so, then go there now
  if( $goal ){
    header( "Location: $goal" );
    exit;
  }
}

#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
analyzeChoices();

adminHeadline( 'Manage competitions' );
showDescription();
showChoices();
if( $chosenNewPassword )
  setNewPassword();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------
  global $errors;

  echo "<dl>\n";
  echo "<dt>Registration</dt><dd>Manage the registered competitors of a competition. You should give the result URL of this to competition organizers.</dd>\n";
  echo "<dt>Edit</dt><dd>Edit the competition configuration data, intended for us admins only.</dd>\n";
  echo "<dt>Results</dt><dd>Brings you to the results page.</dd>\n";
  echo "<dt>New Password</dt><dd>Changes the password of the competition. I suggest you do this once the organizer has finished configuring the competition and you make the competition publicly visible (by editing its \"show\" status), in order to prevent the organizer from introducing mistakes.</dd>\n";
  echo "<dt>Create New</dt><dd>Creates a new competition with the ID entered in the \"New competition ID\" field, then lets you edit it (by jumping to the edit page).</dd>\n";
  echo "<dt>Clone</dt><dd>Clones the competition chosen on the left to a new competition with the ID entered in the \"New competition ID\" field, then lets you edit it (by jumping to the edit page).</dd>\n";
  echo "</dl>\n";

  echo "<hr />\n\n";

  #--- show errors

  if( $errors == 'bad' )
    echo "<p style='color:#F00;font-weight:bold'>Competition IDs must contain only letters or digits.</p>";

  if( $errors == 'duplicate' )
    echo "<p style='color:#F00;font-weight:bold'>This ID already exists.</p>";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenNewPassword, $errors;

  $chosenCompetitionId  = getNormalParam( 'competitionId' );
  $chosenNewPassword = getBooleanParam( 'newPassword' );
  $errors = getNormalParam( 'error' );
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoicesWithMethod( 'post', array(
    competitionChoice( true ),
    choiceButton( true, 'registration', 'Registration' ),
    choiceButton( true, 'edit', 'Edit' ),
    choiceButton( true, 'results', 'Results' ),
    choiceButton( true, 'newPassword', 'New Password' ),
    textFieldChoice ( 'newCompetitionId', 'New competition ID', '' ),
    choiceButton( true, 'createNew', 'Create new' ),
    choiceButton( true, 'clone', 'Clone' ),
  ));
}

#----------------------------------------------------------------------
function setNewPassword () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  #--- Get the old password.
  $oldPassword = getCompetitionPassword( $chosenCompetitionId );

  #--- Generate a new password.
  require_once( '_helpers.php' );
  $newPassword = generateNewPassword( $chosenCompetitionId );

  #--- Store the new password.
  dbCommand( "UPDATE Competitions SET password='$newPassword' WHERE id='$chosenCompetitionId'" );

  #--- Get the competition name.
  $competition = getCompetition( $chosenCompetitionId );
  $name = $competition['cellName'];

  #--- Show what we've done.
  echo "<p>Password for competition <b>$name</b> changed<br />from: $oldPassword<br />to: $newPassword";
}

?>