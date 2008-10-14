<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';
require( '_header.php' );

analyzeChoices();
if( checkPassword() )
  showInformation();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenPassword      = getNormalParam( 'password'      );
}


#----------------------------------------------------------------------
function checkPassword () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;

  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );

  #--- Check the competitionId.
  if( count( $results ) != 1){
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  #--- Check the password.
  $data = $results[0];

  if( $chosenPassword != $data['password'] ){
    showErrorMessage( "wrong password" );
    return false;
  }

  return true;
}

#----------------------------------------------------------------------
function showInformation () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword;

  $results = dbQuery("SELECT * FROM Preregs WHERE competitionId='$chosenCompetitionId'");

  echo "<h1>Extra information</h1>";
  foreach( $results as $result ){
    extract( $result );
    echo "$name ($personId)<br />\n";
    echo "<ul><li>Email : $email</li>\n";
    echo "<ul><li>Guests : $guests</li>\n";
    echo "<ul><li>Comments : $comments</li>\n";
    echo "<ul><li>Ip : $ip</li></ul><br />\n";
    $emailList .= $emailList ? ", $email" : "$email";
  }
 
  echo "<u>Email List :</u><br />\n";
  echo "<textarea cols='100' rows='6' readonly='readonly'>$emailList</textarea><br /><br />";
  echo "<a href='competition_edit.php?competitionId=$chosenCompetitionId&password=$chosenPassword'>Back</a>";

}

?>
