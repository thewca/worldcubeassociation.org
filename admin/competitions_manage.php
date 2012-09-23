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
    $password = getCompetitionPassword( $competitionId, $edit );
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
    $edit = true;
    $password = getCompetitionPassword( $competitionId, $edit );
  }

  #--- Shall we go somewhere?
  if( $registration || $edit )
    $goal = "../competition_edit.php?competitionId=$competitionId&password=$password&rand=" . rand();
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

$currentSection = 'admin';
require( '../_header.php' );
analyzeChoices();

adminHeadline( 'Manage competitions' );
showDescription();
showChoices();
if( $chosenNewAdminPassword || $chosenNewOrganiserPassword )
  setNewPassword( $chosenNewAdminPassword );

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------
  global $errors;

  echo "<dl>\n";
  echo "<dt>Organiser View</dt><dd>You should give the result URL of this to competition organisers. They have to enter the competition's details and then validate. After that, they will only be able to manage the registered competitors of a competition. You can see if a competition has been validated on the Admin page.</dd>\n";
  echo "<dt>Admin View</dt><dd>Edit the competition configuration data, intended for us admins only.</dd>\n";
  echo "<dt>Results</dt><dd>Brings you to the results page.</dd>\n";
  echo "<dt>New Organiser Password</dt><dd>Changes the organiser password of the competition.</dd>\n";
  echo "<dt>New Admin Password</dt><dd>Changes the admin password of the competition.</dd>\n";
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
  global $chosenCompetitionId, $chosenNewAdminPassword, $chosenNewOrganiserPassword, $errors;

  $chosenCompetitionId  = getNormalParam( 'competitionId' );
  $chosenNewAdminPassword = getBooleanParam( 'newAdminPassword' );
  $chosenNewOrganiserPassword = getBooleanParam( 'newOrganiserPassword' );
  $errors = getNormalParam( 'error' );
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoicesWithMethod( 'post', array(
    competitionChoice( true ),
    choiceButton( true, 'registration', 'Organiser View' ),
    choiceButton( true, 'edit', 'Admin View' ),
    choiceButton( true, 'results', 'Results' ),
    choiceButton( true, 'newOrganiserPassword', 'New Organiser Password' ),
    choiceButton( true, 'newAdminPassword', 'New Admin Password' ),
    textFieldChoice ( 'newCompetitionId', 'New competition ID', '' ),
    choiceButton( true, 'createNew', 'Create new' ),
    choiceButton( true, 'clone', 'Clone' ),
  ));
}

#----------------------------------------------------------------------
function setNewPassword ( $admin ) {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  #--- Get the old password.
  $oldPassword = getCompetitionPassword( $chosenCompetitionId, $admin );

  #--- Generate a new password.
  require_once( '_helpers.php' );
  $newPassword = generateNewPassword( $chosenCompetitionId, 'foo' );

  #--- Store the new password.
  if( $admin )
    dbCommand( "UPDATE Competitions SET adminPassword='$newPassword' WHERE id='$chosenCompetitionId'" );
  else
    dbCommand( "UPDATE Competitions SET organiserPassword='$newPassword' WHERE id='$chosenCompetitionId'" );

  #--- Get the competition name.
  $competition = getCompetition( $chosenCompetitionId );
  $name = $competition['cellName'];

  #--- Show what we've done.
  if( $admin )
    echo "<p>Admin password for competition <b>$name</b> changed<br />from: $oldPassword<br />to: $newPassword";
  else
    echo "<p>Organiser password for competition <b>$name</b> changed<br />from: $oldPassword<br />to: $newPassword";
}

?>
