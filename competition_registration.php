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
  global $chosenCompetitionId, $competition, $persons;

  $chosenCountry = $competition['countryId'];

  if( getBooleanParam( 'search' )){
    $chosenPattern = getMysqlParam( 'name' );
	 $chosenName    = getHtmlParam(  'name' );
    
    foreach( explode( ' ', $chosenPattern ) as $namePart )
      $nameCondition .= " AND name like '%$namePart%'";

    $persons = dbQuery( "SELECT name, id FROM Persons WHERE 1 $nameCondition ORDER BY name" );
	 $matchingNumber = count( $persons );
  }

  else if( getBooleanParam( 'confirm' )){
    $chosenPersonId = getNormalParam( 'namelist' );
    $chosenPerson = dbQuery( "SELECT * FROM Persons WHERE id='$chosenPersonId'" );
    $chosenPerson = $chosenPerson[0];
    $chosenName    = htmlEntities( $chosenPerson['name'], ENT_QUOTES );
    $chosenCountry = $chosenPerson['countryId'];
    $chosenGender  = $chosenPerson['gender'   ];
    $chosenYear    = $chosenPerson['year'     ];
    $chosenMonth   = $chosenPerson['month'    ];
    $chosenDay     = $chosenPerson['day'      ];
  }

  else if( getBooleanParam( 'submit' ))
    savePreregForm ();

  echo "<h1>Preregistration for: &nbsp; $competition[name]</h1>";

  echo "<p style='width:90%;margin:1em auto 1em auto;'>Please note that the purpose of the preregistration is not only to reserve you a spot in the competition, but also very importantly to give the organizers a good estimation of the number of people they have to expect. Please don't wait until the very last minute to preregister, otherwise the organizers might not be able to offer enough room, food, etc.</p>";
  
  echo "<p style='width:90%;margin:1em auto 1em auto;'>If you already have a WCA id, which is the case if you already have particpated in an official competition, you can give it instead of your name and country. You can find your WCA id in your <a href='persons.php'>personal page</a>. If not, just leave the field empty.</p>";

 // echo "<p style='width:90%;margin:1em auto 1em auto;'><u>Additional information from the organizer:</u> ...</p>";

  echo "<form method='POST' action='competition.php'>";
  showField( "competitionId hidden $chosenCompetitionId" );
  showField( "form hidden 1" );
  if( getBooleanParam( 'confirm' ))
    showField( "personId hidden $chosenPersonId" );
  
  echo "<table class='prereg'>";
  
  showField( "name name 50 <b>Name</b> $chosenName" );
  if( getBooleanParam( 'search' ))
    showField( "namelist namelist <b>$matchingNumber names matching</b>" );
  showField( "countryId country <b>Citizen&nbsp;of</b> $chosenCountry" );
  showField( "gender gender $chosenGender <b>Gender</b>" );
  showField( "birth date $chosenDay $chosenMonth $chosenYear <b>Date of birth</b>" );
  showField( "email text  50 <b>E-mail</b> address" );
  showField( "guests area  50 3 Names of the <b>guests</b> accompanying you" );

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
  showField( "comments area  50 5 Room for <b>extra information</b>" );
  showField( "ip hidden " . $_SERVER["REMOTE_ADDR"] );
  echo "<tr><td>&nbsp;</td><td style='text-align:center'>";
  echo "<input type='submit' id='submit' name='submit' value='Preregister me!' style='background-color:#9F3;font-weight:bold' /> ";
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
    list( $default, $size, $label ) = split( ' ', $rest, 3 );
    $fieldHtml = "<input id='$id' name='$id' type='text' value='$default' size='$size' />";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'name' ){
  #---------------------
    list( $size, $label, $default ) = split( ' ', $rest, 3 );
    $fieldHtml =  "<input id='$id' name='$id' type='text' value='$default' size='$size' />";
    $fieldHtml .= "<input type='submit' id='search' name='search' value='Search' />";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'namelist' ){
  #---------------------
    global $persons;
    list( $label ) = split( ' ', $rest, 1 );
    $fieldHtml =  "<select id='$id' name='$id'>\n";
	 foreach( $persons as $person ){
      $personName = $person['name'];
      $personId   = $person['id'  ];
      $fieldHtml .= "  <option value='$personId'>$personName</option>\n";
    }
    $fieldHtml .= "</select>";
    $fieldHtml .= "<input type='submit' id='confirm' name='confirm' value='Load' />";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'country' ){
  #---------------------
    list( $label, $default ) = split( ' ', $rest, 2 );
    $fieldHtml = "<select id='$id' name='$id'>\n";
    $countries = getAllUsedCountries ();
    foreach( $countries as $country ){
      $countryId   = $country['id'  ];
      $countryName = $country['name'];
		if( $countryId == $default )
        $fieldHtml .= "  <option value='$countryId' selected='selected' >$countryName</option>\n";
      else
        $fieldHtml .= "  <option value='$countryId'>$countryName</option>\n";
    }
    $fieldHtml .= "</select>";
    $type = 'standard';
  }
  
  #---------------------
  if( $type == 'gender' ){
  #---------------------
    list( $default, $label ) = split( ' ', $rest, 2 );
    if( $default == 'm' )
      $fieldHtml = "Male : <input type='radio' id='$id' name='$id' value='m' checked='checked' /> Female : <input type='radio' id='$id' name='$id' value='f' />";
    else if( $default == 'f' )
      $fieldHtml = "Male : <input type='radio' id='$id' name='$id' value='m' /> Female : <input type='radio' id='$id' name='$id' value='f' checked='checked' />";
    else
      $fieldHtml = "Male : <input type='radio' id='$id' name='$id' value='m' /> Female : <input type='radio' id='$id' name='$id' value='f' />";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'date' ){
  #---------------------
    list( $defaultDay, $defaultMonth, $defaultYear, $label ) = split( ' ', $rest, 4 );
    echo "  <tr><td>$label</td><td>";
    echo numberSelect( "${id}Day", "Day", 1, 31, $defaultDay );
    echo numberSelect( "${id}Month", "Month", 1, 12, $defaultMonth );
    echo numberSelect( "${id}Year", "Year", date("Y"), date("Y")-100, $defaultYear );
    echo "</td></tr>\n";  
  }
  
  #---------------------
  if( $type == 'area' ){
  #---------------------
    list( $default, $cols, $rows, $label ) = split( ' ', $rest, 4 );
    $fieldHtml = "<textarea id='$id' name='$id' cols='$cols' rows='$rows'>$default</textarea>";
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
function numberSelect ( $id, $label, $from, $to, $default ) {
#----------------------------------------------------------------------

  $result = "<select id='$id' name='$id' style='width:5em'>\n";
  foreach( range( $from, $to ) as $i ){
    if( $i == $default )
      $result .= "<option value='$i' selected='selected'>$i</option>\n";
    else
      $result .= "<option value='$i'>$i</option>\n";
  }
  $result .= "</select>\n\n";
  return "<label for='$id'>$label:</label> $result";  

}

#----------------------------------------------------------------------
function savePreregForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;
 
  $personId   = getMysqlParam( 'personId'   );
  $name       = getMysqlParam( 'name'       );
  $countryId  = getMysqlParam( 'countryId'  );
  $gender     = getMysqlParam( 'gender'     );
  $birthYear  = getMysqlParam( 'birthYear'  );
  $birthMonth = getMysqlParam( 'birthMonth' );
  $birthDay   = getMysqlParam( 'birthDay'   );
  $email      = getMysqlParam( 'email'      );
  $guests     = getMysqlParam( 'guests'     );
  $comments   = getMysqlParam( 'comments'   );
  $ip         = getMysqlParam( 'ip'         );
  
  if( !$name or !$email or !$gender ){
    noticeBox( false, "Fields 'name', 'gender' and 'email' are required." );
    return;
  }

  #--- Building query
  $into = "competitionId, name, personId, countryId, gender, birthYear, birthMonth, birthDay, email, guests, comments, ip, status";
  $values = "'$chosenCompetitionId', '$name', '$personId', '$countryId', '$gender', '$birthYear', '$birthMonth', '$birthDay', '$email', '$guests', '$comments', '$ip', 'p'";
  
  foreach( getAllEvents() as $event ){
    $eventId = $event['id'];
    if( getBooleanParam( "E$eventId" )){
      $into .= ", E$eventId";
      $values .= ", '1'";
    }
  }
  dbCommand( "INSERT INTO Preregs ($into) VALUES ($values)" );

  noticeBox( true, "Registration complete." );
}

#----------------------------------------------------------------------
function showPreregList () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  if( getBooleanParam( 'isPreregSubmit' ))
    savePreregForm ();

  #--- Get the data.
  $preregs = dbQuery( "SELECT * FROM Preregs WHERE competitionId = '$chosenCompetitionId' AND status='a' ORDER BY countryId, name" );
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
  tableHeader( split( '\\|', "Person|Citizen of${headerEvent}|#" ), $tableStyle );

  foreach( $preregs as $prereg ){
    extract( $prereg );

	 #--- Compute the row.
    if( $personId ) $row = array( personLink( $personId, $name ));
    else $row = array( $name );

    $countPerson += 1;

    $row[] = $countryId;

    if( ! $listCountries[$countryId] ){
      $listCountries[$countryId] = 1;
      $countCountry += 1;
    }

    $personEvents = 0;

    foreach( $eventList as $event ){
      if( $prereg["E$event"] ){
        $row[] = 'X';
        $countEvents[$event] += 1;
        $personEvents += 1;
      }
      else $row[] = '-';
    }

	 $row[] = $personEvents;

	 tableRow( $row );
  }

  tableRowBlank();
  tableHeader( split( '\\|', "Person|Citizen of${headerEvent}|" ), $tableStyle );
  $row = array( $countPerson, $countCountry );
  foreach( $eventList as $event ){
    if( $countEvents[$event] )
      $row[] = $countEvents[$event];
    else
      $row[] = 0;
  }
  $row[] = '';
  tableRow( $row );
  tableEnd();

}
?>
