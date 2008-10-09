<?

if( preg_match( '/competition_registration.php/', $_SERVER['PHP_SELF'] ))
  $standAlone = true;

if( $standAlone ){
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
function showPreregForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $competition;

  if( getBooleanParam( 'isPreregSubmit' ))
    savePreregForm ();

  echo "<h1>Preregistration for: &nbsp; $competition[name]</h1>";

  echo "<p style='width:90%;margin:1em auto 1em auto;'>Please note that the purpose of the preregistration is not only to reserve you a spot in the competition, but also very importantly to give the organizers a good estimation of the number of people they have to expect. Please don't wait until the very last minute to preregister, otherwise the organizers might not be able to offer enough room, food, etc.</p>";
  
  echo "<p style='width:90%;margin:1em auto 1em auto;'>If you already have a WCA id, which is the case if you already have particpated in an official competition, you can give it instead of your name and country. You can find your WCA id in your <a href='persons.php'>personal page</a>. If not, just leave the field empty.</p>";

 // echo "<p style='width:90%;margin:1em auto 1em auto;'><u>Additional information from the organizer:</u> ...</p>";

  echo "<form method='POST' action='competition.php'>";
  showField( "competitionId hidden $chosenCompetitionId" );
  showField( "isPreregSubmit hidden 1" );
  showField( "form hidden 1" );
  echo "<table class='prereg'>";
  showField( "personId text 10 <b>WCA Id</b>" );  
  echo "<tr height='10'></tr>";
  showField( "firstName text 50 <b>First name</b>" );
  showField( "lastName text 50 <b>Last name</b>" );  
  showField( "countryId country <b>Citizen of</b>" );
  echo "<tr height='10'></tr>";
  showField( "gender gender <b>Gender</b>" );
  showField( "birth date <b>Date of birth</b>" );
  showField( "email text 50 <b>E-mail</b> address" );
  showField( "guests area 50 3 Names of the <b>guests</b> accompanying you" );

?><tr><td><b>Events</b><br /><br />Check the events you want to participate in.<br /><br />Please do not preregister for an event if you do not meet the time limit.</td>
<td>
<?
  
  $eventSpecs = split( ' ', $competition['eventSpecs'] );
  foreach( $eventSpecs as $eventSpec ){
    preg_match( '!^ (\w+) (?: = (\d*) / ([0-9:]*) )? $!x', $eventSpec, $matches );
    list( $all, $eventId, $personLimit, $timeLimit ) = $matches;
    if( ! $personLimit ) $personLimit = "0";
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
    $countries = getAllUsedCountries ();
    foreach( $countries as $country ){
      $countryId   = $country['id'  ];
      $countryName = $country['name'];
      $fieldHtml .= "  <option value='$countryId'>$countryName</option>\n";
    }
    $fieldHtml .= "</select>";
    $type = 'standard';
  }
  
  #---------------------
  if( $type == 'gender' ){
  #---------------------
    list( $label ) = split( ' ', $rest, 1 );
    $fieldHtml = "Male : <input type='radio' id='$id' name='$id' value='m' /> Female : <input type='radio' id='$id' name='$id' value='f' />";
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

#----------------------------------------------------------------------
function savePreregForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;
 
  $personId   = getMysqlParam( 'personId'   );
  $name       = getMysqlParam( 'firstName'  ) . ' ' . getMysqlParam( 'lastName' );
  $countryId  = getMysqlParam( 'countryId'  );
  $gender     = getMysqlParam( 'gender'     );
  $birthYear  = getMysqlParam( 'birthYear'  );
  $birthMonth = getMysqlParam( 'birthMonth' );
  $birthDay   = getMysqlParam( 'birthDay'   );
  $email      = getMysqlParam( 'email'      );
  $guests     = getMysqlParam( 'guests'     );
  $comments   = getMysqlParam( 'comments'   );
  
  if( $personId ){
    $results = dbQuery( "SELECT name, countryId FROM Persons WHERE id='$personId'" );
    
    noticeBox2( count( $results ),
      "Registration was successfully saved.",
      "Registration wasn't saved : Invalid WCA id."
    );

	 if( count( $results )){
      $name = $results[0]['name'];
      $countryId = $results[0]['countryId'];
    }
    else{
      return;
    }
  }


  #--- Building query
  $into = "competitionId, name, personId, countryId, gender, birthYear, birthMonth, birthDay, email, guests, comments";
  $values = "'$chosenCompetitionId', '$name', '$personId', '$countryId', '$gender', '$birthYear', '$birthMonth', '$birthDay', '$email', '$guests', '$comments'";
  
  foreach( getAllEvents() as $event ){
    $eventId = $event['id'];
    if( getBooleanParam( "E$eventId" )){
      $into .= ", E$eventId";
      $values .= ", '1'";
    }
  }
  dbCommand( "INSERT INTO Preregs ($into) VALUES ($values)" );

  echo "<p style='width:90%;margin:1em auto 1em auto;'>Registration complete.</p>";
}

#----------------------------------------------------------------------
function showPreregList () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  if( getBooleanParam( 'isPreregSubmit' ))
    savePreregForm ();

  #--- Get the data.
  $preregs = dbQuery( "SELECT * FROM Preregs WHERE competitionId = '$chosenCompetitionId'" );
  $competition = getFullCompetitionInfos( $chosenCompetitionId );

  #--- Get all events of the competition.
  $eventSpecs = split( ' ', $competition['eventSpecs'] );

  foreach( $eventSpecs as $eventSpec ){
    preg_match( '!^ (\w+) (?: = (\d*) / ([0-9:]*) )? $!x', $eventSpec, $matches );
    list( $all, $eventId, $personLimit, $timeLimit ) = $matches;
    $eventList[] = $eventId;
  }

  foreach( $eventList as $event ){ $headerEvent .= "|$event"; }

  for( $i = 2; $i < 2 + count( $eventList ); $i++)
    $tableStyle[$i] = 'class="c"';
  $tableStyle[2 + count( $eventList )] = 'class="f"';

  tableBegin( 'results', 3 + count( $eventList ));
  tableHeader( split( '\\|', "Person|Citizen of${headerEvent}|" ),
               $tableStyle );


  foreach( $preregs as $prereg ){
    extract( $prereg );

	 #--- Compute the row.
    if( $personId ) $row = array( personLink( $personId, $name ));
    else $row = array( $name );

    $row[] = $countryId;

    foreach( $eventList as $event ){
      if( $prereg["E$event"] ) $row[] = 'X';
      else $row[] = '-';
    }

	 $row[] = '';

	 tableRow( $row );
  }

  tableEnd();

}
?>
