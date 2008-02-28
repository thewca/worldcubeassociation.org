<?

if( preg_match( '/competition_prereg_form.php/', $_SERVER['PHP_SELF'] ))
  $standAlone = true;

if( $standAlone2 ){
  require_once( '_framework.php' );
  $chosenCompetitionId = getNormalParam( 'competitionId' );
  ?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<meta name="author" content="Stefan Pochmann, Josef Jelinek" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/general.css" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/tables.css" />
</head>
<body><?

  #--- Get all competition infos.
  $competition = getFullCompetitionInfos( $chosenCompetitionId );
  
  #--- Show form (or display error if competition not found).
  if( $competition ){
    showPreregForm();
  } else {
    noticeBox( false, "Unknown competition ID \"$chosenCompetitionId\"" );
  }
  ?></body></html><?
}

#----------------------------------------------------------------------
function showPreregFormNow () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $competition;
  
  echo "<h1>Preregistration for: &nbsp; $competition[name]</h1>";

  echo "<p style='width:90%;margin:1em auto 1em auto;'>Please note that the purpose of the preregistration is not only to reserve you a spot in the competition, but also very importantly to give the organizers a good estimation of the number of people they have to expect. Please don't wait until the very last minute to preregister, otherwise the organizers might not be able to offer enough room, food, etc.</p>";

  echo "<p style='width:90%;margin:1em auto 1em auto;'><u>Additional information from the organizer:</u> ...</p>";

  echo "<form method='POST' action='_display_parameters.php'>";
  showField( "competitionId hidden $chosenCompetitionId" );
  showField( "isPreregSubmit hidden 1" );
  echo "<table class='prereg'>";
  showField( "firstName text 50 <b>First name</b>" );
  showField( "lastName text 50 <b>Last name</b>" );  
#<tr><td><label for="country">Citizen of (country)</label></td><td><input id="country" type="text" name="country" size="50" value=""></td></tr>
  showField( "countryId country <b>Citizen of</b>" );
#  showField( "dateOfBirth text 50 Date of birth<br />(example April 20, 1967)" );
  showField( "birth date <b>Date of birth</b>" );
  showField( "email text 50 <b>E-mail</b> address" );
  showField( "guests area 50 3 Names of the <b>guests</b> accompanying you" );
  showField( "volunteers area 50 3 Names of the volunteering <b>judges/scramblers</b> (all competitors must be available for judging and scrambling)" );

?><tr><td><b>Events</b><br /><br />Check the events you want to participate in.<br /><br />Please do not preregister for an event if you do not meet the time limit.</td>
<td>
<?
  
  $eventSpecs = split( ' ', $competition['eventSpecs'] );
#  print_r( $eventSpecs );
  foreach( $eventSpecs as $eventSpec ){
    preg_match( '!^ (\w+) (?: = (\d*) / ([0-9:]*) )? $!x', $eventSpec, $matches );
    list( $all, $eventId, $personLimit, $timeLimit ) = $matches;
    if( ! $personLimit ) $personLimit = "0";
#  echo "[$eventSpec:$eventId:$personLimit:$timeLimit]";
    showField( "E$eventId event $personLimit $timeLimit" );
  }
  echo "</td></tr>";
  showField( "comments area 50 5 Room for <b>extra information</b>" );
  echo "<tr><td>&nbsp;</td><td style='text-align:center'>";
  echo "<input type='submit' value='Preregister me!' style='background-color:#9F3;font-weight:bold' /> ";
  echo "<input type='reset' value='Empty form' style='background-color:#F63;font-weight:bold' />";
  echo "</td></tr>";

  echo "</table>";
  echo "</form>";
}

#----------------------------------------------------------------------
function showField ( $fieldSpec ) {
#----------------------------------------------------------------------

  list( $id, $type, $rest ) = split( ' ', $fieldSpec, 3 );

  #---------------------
  if( $type == 'hidden' ){
  #---------------------
    $value = $rest;
    echo "<input id='$id' name='$id' type='hidden' value='$value' />";
  }
  
  #---------------------
  if( $type == 'text' ){
  #---------------------
    list( $size, $label ) = split( ' ', $rest, 2 );
    $fieldHtml = "<input id='$id' name='$id' type='text' value='' size='$size' />";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'country' ){
  #---------------------
    list( $label ) = split( ' ', $rest, 1 );
    $fieldHtml = "<select id='$id' name='$id'>\n";
    $countries = dbQuery( "SELECT id countryId, name countryName FROM Countries ORDER BY name" );
    foreach( $countries as $country ){
      extract( $country );
      $fieldHtml .= "  <option value='$countryId'>$countryName</option>\n";
    }
    $fieldHtml .= "</select>";
    $type = 'standard';
  }
  
  #---------------------
  if( $type == 'date' ){
  #---------------------
    list( $label ) = split( ' ', $rest, 1 );
    echo "  <tr><td>$label</td><td>";
    echo numberSelect( "${id}Day", "Day", 1, 31 );
    echo numberSelect( "${id}Month", "Month", 1, 12 );
    echo numberSelect( "${id}Year", "Year", date("Y"), date("Y")-100 );
    echo "</td></tr>\n";  
  }
  
  #---------------------
  if( $type == 'area' ){
  #---------------------
    list( $cols, $rows, $label ) = split( ' ', $rest, 3 );
    $fieldHtml = "<textarea id='$id' name='$id' cols='$cols' rows='$rows'></textarea>";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'standard' ){
  #---------------------
    echo "  <tr><td width='30%'><label for='$id'>$label</label></td><td>$fieldHtml</td></tr>\n";  
  }
  
  #---------------------
  if( $type == 'event' ){
  #---------------------
    $eventId = substr( $id, 1 );
    $eventName = eventCellName( $eventId );
    
    list( $personLimit, $timeLimit ) = split( ' ', $rest, 2 );
    if( $timeLimit )
      $timeLimit = " (time limit $timeLimit)";
    echo "<input id='$id' name='$id' type='checkbox' value='yes' />";
    echo " <label for='$id'>$eventName$timeLimit</label><br />";
  }
}

#----------------------------------------------------------------------
function numberSelect ( $id, $label, $from, $to ) {
#----------------------------------------------------------------------

  $result = "<select id='$id' name='$id' style='width:5em'>\n";
  foreach( range( $from, $to ) as $i )
    $result .= "<option value='$i'>$i</option>\n";
  $result .= "</select>\n\n";
  return "<label for='$id'>$label:</label> $result";  

}

?>
