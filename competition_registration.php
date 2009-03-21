<?

if( preg_match( '/competition_registration.php/', $_SERVER['PHP_SELF'] ))
  $standAlone = true;

if( $standAlone ){
  require_once( '_framework.php' );
  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenList = getBooleanParam( 'list' );
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
    if( $chosenList ) 
      showPreregList(); 
    else 
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

  else if( getBooleanParam( 'submit' )){
    savePreregForm ();
    $chosenPersonId = getHtmlParam( 'personId'   );
    $chosenName     = getHtmlParam( 'name'       );
    $chosenCountry  = getHtmlParam( 'countryId'  );
    $chosenGender   = getHtmlParam( 'gender'     );
    $chosenYear     = getHtmlParam( 'birthYear'  );
    $chosenMonth    = getHtmlParam( 'birthMonth' );
    $chosenDay      = getHtmlParam( 'birthDay'   );
    $chosenEmail    = getHtmlParam( 'email'      );
    $chosenGuests   = getHtmlParam( 'guests'     );
    $chosenComments = getHtmlParam( 'comments'   );
  }

  echo "<h1>Registration form</h1>";

  echo "<p style='width:90%;margin:1em auto 1em auto;'>Please note that the purpose of the preregistration is not only to reserve you a spot in the competition, but also very importantly to give the organisers a good estimation of the number of people they have to expect. Please don't wait until the very last minute to preregister, otherwise the organisers might not be able to offer enough room, food, etc.</p>";
  
  echo "<p style='width:90%;margin:1em auto 1em auto;'>If you already have participated in an official competition, you can use the search function which will fill the information stored in the database. You can then fill the rest.</p>";

  echo "<form method='POST' action='$_SERVER[PHP_SELF]?competitionId=$chosenCompetitionId'>";
  showField( "form hidden 1" );
  echo "<table class='prereg'>";
  if( $chosenPersonId )
    showField( "personId readonly $chosenPersonId 11 <b>WCA Id</b>" );
  showField( "name name 50 <b>Name</b> $chosenName" );
  if( getBooleanParam( 'search' ))
    showField( "namelist namelist <b>$matchingNumber names matching</b>" );
  else {
    showField( "countryId country <b>Citizen&nbsp;of</b> $chosenCountry" );
    showField( "gender gender $chosenGender <b>Gender</b>" );
    showField( "birth date $chosenDay $chosenMonth $chosenYear <b>Date of birth</b>" );
    showField( "email text $chosenEmail 50 <b>E-mail</b> address" );
    showField( "guests area 50 3 Names&nbsp;of&nbsp;the&nbsp;<b>guests</b>&nbsp;accompanying&nbsp;you $chosenGuests" );

?><tr><td><b>Events</b><br /><br />Check the events you want to participate in.</td>
<td>
<?
  
  $eventSpecs = split( ' ', $competition['eventSpecs'] );
  foreach( $eventSpecs as $eventSpec ){
    preg_match( '!^ (\w+) (?: = (\d*) / ([0-9:]*) )? $!x', $eventSpec, $matches );
    list( $all, $eventId, $personLimit, $timeLimit ) = $matches;
    if( ! $personLimit ) $personLimit = "0";
	 $chosenE = getBooleanParam( "E$eventId" );
    showField( "E$eventId event $personLimit $timeLimit $chosenE" );
  }
  echo "</td></tr>";
  showField( "comments area 50 5 Room&nbsp;for&nbsp;<b>extra&nbsp;information</b> $chosenComments" );
  showField( "ip hidden " . $_SERVER["REMOTE_ADDR"] );
  echo "<tr><td>&nbsp;</td><td style='text-align:center'>";
  echo "<input type='submit' id='submit' name='submit' value='Preregister me!' style='background-color:#9F3;font-weight:bold' /> ";
  echo "<input type='reset' value='Empty form' style='background-color:#F63;font-weight:bold' />";
  echo "</td></tr>";
}
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
  if( $type == 'readonly' ){
  #---------------------
    list( $default, $size, $label ) = split( ' ', $rest, 3 );
    $fieldHtml = "<input id='$id' name='$id' type='text' value='$default' size='$size' readonly='readonly' />";
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
    $countries = dbQuery( "SELECT * FROM Countries" );
    foreach( $countries as $country ){
      $countryId   = $country['id'  ];
      $countryName = $country['name'];
		if( $countryId == $default )
        $fieldHtml .= "  <option value=\"$countryId\" selected='selected' >$countryName</option>\n";
      else
        $fieldHtml .= "  <option value=\"$countryId\">$countryName</option>\n";
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
    list( $cols, $rows, $label, $default ) = split( ' ', $rest, 4 );
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

    list( $personLimit, $timeLimit, $default ) = split( ' ', $rest, 3 );
    if( $timeLimit )
      $timeLimit = " (time limit $timeLimit)";
    if( $default )
      echo "<input id='$id' name='$id' type='checkbox' value='yes' checked='checked' />";
    else
      echo "<input id='$id' name='$id' type='checkbox' value='yes' />";
    if( count( dbQuery( "SELECT * FROM Events WHERE id='$eventId' AND rank<1000" )))
      echo " <label for='$id'>$eventName$timeLimit</label><br />";
    else
      echo " <label for='$id' style='color:#999'>$eventName$timeLimit</label><br />";
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
  global $chosenCompetitionId, $competition;
 
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

  if( !eregi( "^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$", $email )){
    noticeBox( false, "Incorrect email address." );
    return;
  }

  #--- Building query
  $into = "competitionId, name, personId, countryId, gender, birthYear, birthMonth, birthDay, email, guests, comments, ip, status";
  $values = "'$chosenCompetitionId', '$name', '$personId', '$countryId', '$gender', '$birthYear', '$birthMonth', '$birthDay', '$email', '$guests', '$comments', '$ip', 'p'";
  
  foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event ){
    $eventId = $event['id'];
    if( getBooleanParam( "E$eventId" )){
      $into .= ", E$eventId";
      $values .= ", '1'";
    }
  }

  dbCommand( "INSERT INTO Preregs ($into) VALUES ($values)" );

  $organiserEmail = preg_replace( '/\[{ ([^}]+) }{ ([^}]+) }]/x', "$2 ", $competition['organiser'] );
  $organiserEmail = preg_replace( '/\\\\([\'\"])/', '$1', $organiserEmail );
  if( preg_match( '/^mailto:([\S]+)/', $organiserEmail, $match )){
    $mailEmail = $match[1];

    if( $personId )
      $mailBody = "Name : $name ($personId)\n";
    else
      $mailBody = "Name : $name\n";

    $mailBody .= "Country : $countryId\n";
    $mailBody .= "Gender : $gender\n";
    $mailBody .= "Date of birth : $birthYear/$birthMonth/$birthDay\n";
    $mailBody .= "Email : $email\n";

    $mailBody .= "Events :";
    foreach( array_merge( getAllEvents(), getAllUnofficialEvents() ) as $event ){
      $eventId = $event['id'];
      if( getBooleanParam( "E$eventId" ))
        $mailBody .= " $eventId";
    }

    $mailBody .= "\nGuests : $guests\n";
    $mailBody .= "Comments : $comments\n";
    $mailBody .= "Ip : $ip";

    $mailSubject = "$competition[cellName] - New registration";

    $mailHeaders = "From: \"WCA\" <rbruchem@worldcubeassociation.org>\r\n";
    $mailHeaders .= "Reply-To: $email\r\n";

    mail( $mailEmail, $mailSubject, $mailBody, $mailHeaders );

  }

  noticeBox( true, "Registration complete." );
}

#----------------------------------------------------------------------
function showPreregList () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  echo "<h1>Registered competitors</h1><br />";
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
    if( $personId ){
      if( preg_match( '/competition_registration.php/', $_SERVER['PHP_SELF'] ))
        $row = array( "<a target='_blank' class='p' href='p.php?i=$personId'>$name</a>" );
      else
        $row = array( personLink( $personId, $name ));
    }
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

  //tableRowBlank();
  //tableHeader( split( '\\|', "Person|Citizen of${headerEvent}|" ), $tableStyle );
  $row = array( $countPerson, $countCountry );
  foreach( $eventList as $event ){
    if( $countEvents[$event] )
      $row[] = $countEvents[$event];
    else
      $row[] = 0;
  }
  $row[] = '';
  tableRowStyled( 'text-align:center', $row );
  tableEnd();

}

?>
