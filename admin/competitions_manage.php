<?php
#----------------------------------------------------------------------
#   Redirects...
#----------------------------------------------------------------------

handleRedirects();
function handleRedirects () {
  extract( $_REQUEST );

  if( $edit || $fullEdit || $createNew || $clone ){
    ob_start(); require( '../_framework.php' ); ob_end_clean();
    $password = getCompetitionPassword( $competitionId );
  }

  if( $createNew || $clone ){

    #--- Is the new ID ok?
    if( ! preg_match( '/^\w+$/', $newCompetitionId )){
      header( "Location: competitions_manage.php?error=bad" );
      exit;
    }

	 $result = dbQuery(
       "SELECT *
       FROM Competitions
       WHERE id='$newCompetitionId'"
    );

	 if( count( $result ) > 0 ){
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
  
  if( $edit )
    $goal = "../competition_edit.php?competitionId=$competitionId&password=$password&rand=" . rand();
  if( $fullEdit )
    $goal = "../competition_edit.php?FULLEDIT=7247&competitionId=$competitionId&password=$password&rand=" . rand();
  if( $results )
    $goal = "../competition.php?competitionId=$competitionId";
      
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

#print_r( getRawParamsThisShouldBeAnException() );

showDescription();
showChoices();
if( $chosenNewPassword )
  setNewPassword();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------
  global $errors;

  echo "<p><b>This script *DOES* affect the database *WHEN* you tell it to.</b></p>";

  echo "<dl>";
  echo "<dt>Edit</dt><dd>Edit competition configuration data like the organizers (i.e. not all fields). You should give the result URL of this to competition organizers so they can configure their own competition.</dd>";
  echo "<dt>Full Edit</dt><dd>Edit the whole competition configuration data, intended for us admins only. You should *not* give the result URL of this to others.</dd>";
  echo "<dt>Results</dt><dd>Brings you to the results page.</dd>";
  echo "<dt>New Password</dt><dd>Changes the password of the competition. I suggest you do this once the organizer has finished configuring the competition and you make the competition publicly visible (by editing its \"show\" status), in order to prevent the organizer from introducing mistakes.</dd>";
  echo "<dt>Create New</dt><dd>Creates a new competition with the ID entered in the \"New competition ID\" field, then lets you edit it (by jumping to the edit page).</dd>";
  echo "<dt>Clone</dt><dd>Clones the competition chosen on the left to a new competition with the ID entered in the \"New competition ID\" field, then lets you edit it (by jumping to the edit page).</dd>";
  echo "</dl>";
  
  echo "<hr>";

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

  displayChoicesWithMethod( 'POST', array(
    competitionChoice( true ),
    choiceButton( true, 'edit', 'Edit' ),
    choiceButton( true, 'fullEdit', 'Full Edit' ),
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
