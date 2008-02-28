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
      echo "TODO";
      exit;
    }
    
    #--- Create the new competition.
    ob_start(); require( '_helpers.php' ); ob_end_clean();
    if( $clone )
      cloneNewCompetition( $newCompetitionId, $competitionId );
    else
      createNewCompetition( $newCompetitionId );
      
    $TODO = "update the auxiliary data";
     
    #--- Forward to edit page.
    $competitionId = $newCompetitionId;
    $password = getCompetitionPassword( $competitionId );
    $edit = true;
  }
  
  if( $edit )
    $goal = "../competition_edit.php?competitionId=$competitionId&password=$password";
  if( $fullEdit )
    $goal = "../competition_edit.php?FULLEDIT=7247&competitionId=$competitionId&password=$password";
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
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenNewPassword;

  $chosenCompetitionId  = getNormalParam( 'competitionId' );
  $chosenNewPassword = getBooleanParam( 'newPassword' );
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
