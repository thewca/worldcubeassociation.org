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
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="author" content="Stefan Pochmann, Josef Jelinek" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/general.css" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/tables.css" />
</head>
<body><?

  #--- Get all competition infos.
  $competition = getFullCompetitionInfos( $chosenCompetitionId );

  #--- Show form (or display error if competition not found).
  if( $competition ){
    if( $chosenList ){
      if( $competition['showPreregList'] ) showPreregList();
      else showPreregForm();
    }
    else {
      if( $competition['showPreregForm'] ) showPreregForm();
      else showPreregList();
    }
  }
  else {
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

    $persons = dbQuery( "SELECT name, id FROM Persons WHERE 1 $nameCondition AND subId='1' ORDER BY name" );
    $matchingNumber = count( $persons );
  }

  else if( getBooleanParam( 'confirm' )){
    $chosenPersonId = getNormalParam( 'namelist' );
    $chosenPerson = dbQuery( "SELECT * FROM Persons WHERE id='$chosenPersonId' AND subId='1'" );
    $chosenPerson = $chosenPerson[0];
    $chosenName    = htmlEscape( $chosenPerson['name'] );
    $chosenCountry = $chosenPerson['countryId'];
    $chosenGender  = $chosenPerson['gender'   ];
    $chosenYear    = $chosenPerson['year'     ];
    $chosenMonth   = $chosenPerson['month'    ];
    $chosenDay     = $chosenPerson['day'      ];

    $dontPrintDoB  = ( $chosenYear != 0 );
  }

  else if( getBooleanParam( 'submit' )){
    $saveSucceeded = savePreregForm ();
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

    $dontPrintDoB  = ( $chosenYear == '');
  }

  echo "<h1>Registration form</h1>";

  echo "<p style='width:90%;margin:1em auto 1em auto;'>Please note that the purpose of the preregistration is not only to reserve you a spot in the competition, but also very importantly to give the organisers a good estimation of the number of people they have to expect. Please don't wait until the very last minute to preregister, otherwise the organisers might not be able to offer enough room, food, etc.</p>";
  
  echo "<p style='width:90%;margin:1em auto 1em auto;'>If you already have participated in an official competition, you can use the search function which will fill the information stored in the database. You can then fill the rest.</p>";

  echo "<form method='POST' action='$_SERVER[PHP_SELF]?competitionId=$chosenCompetitionId'>";
  showField( "form hidden 1" );
  echo "<table class='prereg'>";
  if( isset( $chosenPersonId ))
    showField( "personId readonly $chosenPersonId 11 <b>WCA Id</b>" );

  if( ! isset( $chosenName ))
    $chosenName = "";
  if( getBooleanParam( 'new' ))
    showField( "name text $chosenName 50 <b>Name</b>" );
  else
    showField( "name name 50 <b>Name</b> $chosenName" );

  if( getBooleanParam( 'search' )) {
    showField( "namelist namelist <b>$matchingNumber names matching</b>" );
    echo "<tr><td></td><td><input type='submit' id='new' name='new' value='I am new !' /></td></tr> ";
  }
  else if(( getBooleanParam( 'submit' ) && ! $saveSucceeded ) || getBooleanParam( 'confirm' ) || getBooleanParam( 'new' )) {
    showField( "countryId country <b>Citizen&nbsp;of</b> $chosenCountry" );
    showField( "gender gender $chosenGender <b>Gender</b>" );
    if( ! $dontPrintDoB )
      showField( "birth date $chosenDay $chosenMonth $chosenYear <b>Date of birth</b>" );
    showField( "email text $chosenEmail 50 <b>E-mail</b> address" );
    showField( "guests area 50 3 Names&nbsp;of&nbsp;the&nbsp;<b>guests</b>&nbsp;accompanying&nbsp;you $chosenGuests" );

?><tr><td><b>Events</b><br /><br />Check the events you want to participate in.</td>
<td>
<?
  
  $eventSpecs = readEventSpecs( $competition['eventSpecs'] );
  foreach( $eventSpecs as $eventId => $eventSpec ){
    extract( $eventSpec );
    if( ! $personLimit ) $personLimit = "0";
      $chosenE = getBooleanParam( "E$eventId" );
    showField( "E$eventId event $personLimit $timeLimit $timeFormat $chosenE" );
  }
  echo "</td></tr>";
  showField( "comments area 50 5 Room&nbsp;for&nbsp;<b>extra&nbsp;information</b> $chosenComments" );
  showField( "ip hidden " . $_SERVER["REMOTE_ADDR"] );
  echo "<tr><td>&nbsp;</td><td style='text-align:center'>";
  echo "<input type='submit' id='submit' name='submit' value='Preregister me!' style='background-color:#9F3;font-weight:bold' /> ";
  echo "<input type='reset' value='Empty form' style='background-color:#F63;font-weight:bold' />";
  echo "</td></tr>";
}
  else
    echo "<tr><td></td><td><input type='submit' id='new' name='new' value='I am new !' /></td></tr> ";
  echo "</table>";
  echo "</form>";
}

#----------------------------------------------------------------------
function showField ( $fieldSpec ) {
#----------------------------------------------------------------------

  list( $id, $type, $rest ) = explode( ' ', $fieldSpec, 3 );

  #---------------------
  if( $type == 'hidden' ){
  #---------------------
    $value = $rest;
    echo "<input id='$id' name='$id' type='hidden' value='$value' />";
  }
  
  #---------------------
  if( $type == 'text' ){
  #---------------------
    list( $default, $size, $label ) = explode( ' ', $rest, 3 );
    $fieldHtml = "<input id='$id' name='$id' type='text' value='$default' size='$size' />";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'readonly' ){
  #---------------------
    list( $default, $size, $label ) = explode( ' ', $rest, 3 );
    $fieldHtml = "<input id='$id' name='$id' type='text' value='$default' size='$size' readonly='readonly' />";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'name' ){
  #---------------------
    list( $size, $label, $default ) = explode( ' ', $rest, 3 );
    $fieldHtml =  "<input id='$id' name='$id' type='text' value='$default' size='$size' />";
    $fieldHtml .= "<input type='submit' id='search' name='search' value='Search' />";
    $type = 'standard';
  }

  #---------------------
  if( $type == 'namelist' ){
  #---------------------
    global $persons;
    list( $label ) = explode( ' ', $rest, 1 );
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
    list( $label, $default ) = explode( ' ', $rest, 2 );

    $fieldHtml = "<select id='$id' name='$id'>\n";
    $countries = dbQuery( "SELECT * FROM Countries ORDER BY name" );
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
    list( $default, $label ) = explode( ' ', $rest, 2 );
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
    list( $defaultDay, $defaultMonth, $defaultYear, $label ) = explode( ' ', $rest, 4 );
    echo "  <tr><td>$label</td><td>";
    echo numberSelect( "${id}Day", "Day", 1, 31, $defaultDay );
    echo numberSelect( "${id}Month", "Month", 1, 12, $defaultMonth );
    echo numberSelect( "${id}Year", "Year", date("Y"), date("Y")-100, $defaultYear );
    echo "</td></tr>\n";  
  }
  
  #---------------------
  if( $type == 'area' ){
  #---------------------
    list( $cols, $rows, $label, $default ) = explode( ' ', $rest, 4 );
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
    $event = getEvent( $eventId );
    $eventName = $event['cellName'];
    $eventFormat = $event['format'];

    list( $personLimit, $timeLimit, $timeFormat, $default ) = explode( ' ', $rest, 4 );

    if( $timeLimit ) {

      $timeFormat = ( $timeFormat == 's' ) ? 'single' : 'average';

      if( $eventFormat == 'multi' ){ 
        if( $timeLimit > 1 )
          $timeLimit = "$timeLimit cubes";
        else
          $timeLimit = "1 cube";
      }

      else
        $timeLimit = formatValue( $timeLimit, $eventFormat );

      $timeLimit = " ($timeFormat limit $timeLimit)";

    }

    if( $default )
      echo "<input id='$id' name='$id' type='checkbox' value='yes' checked='checked' />";
    else
      echo "<input id='$id' name='$id' type='checkbox' value='yes' />";
    if( count( dbQuery( "SELECT * FROM Events WHERE id='$eventId' AND rank<999" )))
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
    return false;
  }

  if( !eregi( "^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$", $email )){
    noticeBox( false, "Incorrect email address." );
    return false;
  }

  if( $birthYear == date('Y') ){
    noticeBox( false, "Please enter your date of birth." );
    return false;
  }

  if( ! $birthYear ){
    $chosenPerson = dbQuery( "SELECT * FROM Persons WHERE id='$personId'" );
    $chosenPerson = $chosenPerson[0];
    $birthYear    = $chosenPerson['year'     ];
    $birthMonth   = $chosenPerson['month'    ];
    $birthDay     = $chosenPerson['day'      ];
  }


  $guests = str_replace(array("\r\n", "\n", "\r", ","), ";", $guests);

  #--- Building query
  foreach( getAllEventIds() as $eventId ){
    if( getBooleanParam( "E$eventId" ))
      $eventIds .= "$eventId ";
  }
  rtrim( $eventIds ); # Remove last space

  $into = "competitionId, name, personId, countryId, gender, birthYear, birthMonth, birthDay, email, guests, comments, ip, status, eventIds";
  $values = "'$chosenCompetitionId', '$name', '$personId', '$countryId', '$gender', '$birthYear', '$birthMonth', '$birthDay', '$email', '$guests', '$comments', '$ip', 'p', '$eventIds'";
  

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

    $mailBody .= "Events : $eventIds\n";

    $mailBody .= "Guests : $guests\n";
    $mailBody .= "Comments : $comments\n";
    $mailBody .= "Ip : $ip";

    $mailSubject = "$competition[cellName] - New registration";

    $mailHeaders = "From: \"WCA\" <rbruchem@worldcubeassociation.org>\r\n";
    $mailHeaders .= "Reply-To: $email\r\n";
    $mailHeaders .= "MIME-Version: 1.0\r\n";
    $mailHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";

    mail( $mailEmail, $mailSubject, $mailBody, $mailHeaders );

  }

  noticeBox( true, "Registration complete.<br />Please note that all registrations must be approved by the organiser.<br/>Your registration will appear here within a few days." );
  return true;
}

#----------------------------------------------------------------------
function showPreregList () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  if( getBooleanParam( 'isPreregSubmit' ))
    savePreregForm ();

  $eventId = getNormalParam ( 'eventId' );

  if( $eventId ){
    showPsychSheet( $eventId );
    return;
  }

  echo "<h1>Registered competitors</h1><br />";

  #--- Get the data.
  $preregs = dbQuery( "SELECT * FROM Preregs WHERE competitionId = '$chosenCompetitionId' AND status='a' ORDER BY countryId, name" );
  $competition = getFullCompetitionInfos( $chosenCompetitionId );

  #--- Get all events of the competition.
  $eventList = getEventSpecsEventIds( $competition['eventSpecs'] );

  $headerEvent = "";
  $headerEventLink = "";
  foreach( $eventList as $event ){
    $headerEvent .= "|$event";
    $headerEventLink .= "|<a href='c.php?list=1&competitionId=$chosenCompetitionId&eventId=$event'>$event</a>";
  }

  for( $i = 3; $i < 3 + count( $eventList ); $i++)
    $tableStyle[$i] = 'class="c"';
  $tableStyle[3 + count( $eventList )] = 'class="f"';

  tableBegin( 'results', 4 + count( $eventList ));

  $countPerson = 0;

  foreach( $preregs as $prereg ){
    extract( $prereg );

    if( !( $countPerson % 20 )){
      if( $countPerson )
        tableHeader( explode( '|', "#|Person|Citizen of${headerEvent}|" ), $tableStyle );
      else{
        if( isset( $standAlone ))
          tableHeader( explode( '|', "#|Person|Citizen of${headerEvent}|" ), $tableStyle );
        else
          tableHeader( explode( '|', "#|Person|Citizen of${headerEventLink}|" ), $tableStyle );
      }
    }

    $countPerson += 1;

    #--- Compute the row.

    $row = array( $countPerson );

    if( $personId ){
      if( preg_match( '/competition_registration.php/', $_SERVER['PHP_SELF'] ))
        $row[] = "<a target='_blank' class='p' href='p.php?i=$personId'>$name</a>";
      else
        $row[] = personLink( $personId, $name );
    }
    else $row[] = $name;


    $row[] = $countryId;

    $countCountry = 0;
    if( ! isset( $listCountries[$countryId] )){
      $listCountries[$countryId] = 1;
      $countCountry += 1;
    }

    $personEvents = 0;
    $eventIdsList = array_flip( explode( ' ', $eventIds ));

    foreach( $eventList as $event ){
      if( isset( $eventIdsList[$event] )){
        $row[] = 'X';
        $countEvents[$event] = isset( $countEvents[$event] ) ? $countEvents[$event] + 1 : 1;
        $personEvents += 1;
      }
      else $row[] = '-';
    }

    $row[] = $personEvents;
    tableRow( $row );
  }

  $row = array( '', 'Total', $countCountry );
  foreach( $eventList as $event ){
    if( isset( $countEvents[$event] ))
      $row[] = $countEvents[$event];
    else
      $row[] = 0;
  }
  $row[] = '';
  tableHeader( $row, $tableStyle );

  tableEnd();

}

#----------------------------------------------------------------------
function showPsychSheet ( $eventId ) {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  echo "<h1>Psych Sheet</h1><br />";
 
  #--- Best or Average ?
  $avg = dbQuery( "SELECT * FROM RanksAverage WHERE eventId='$eventId' LIMIT 1" );
  if( count( $avg ) > 0 ){
    $isAvg = true;
    $table = 'Average';
  }
  else
    $table = 'Single';

  #--- Get the data.

  $preregs = dbQuery( "
    SELECT prereg.*, rank.best best, rank.worldRank worldRank
    FROM Preregs prereg, Ranks$table rank
    WHERE prereg.competitionId = '$chosenCompetitionId'
      AND prereg.status = 'a'
      AND prereg.personId = rank.personId
      AND prereg.personId <> ''
      AND rank.eventId = '$eventId'
    ORDER BY rank.best, prereg.countryId, prereg.name" );

  $newPreregs = dbQuery( "
    SELECT prereg.*
    FROM Preregs prereg
    WHERE prereg.competitionId = '$chosenCompetitionId'
      AND prereg.status = 'a'
      AND NOT EXISTS (
        SELECT *
        FROM Ranks$table
        WHERE prereg.personId = personId
          AND personId <> ''
          AND eventId = '$eventId'
      )
    ORDER BY prereg.countryId, prereg.name" );

  tableBegin( 'results', 6);
  tableCaption( false, eventName( $eventId ));
  if( $isAvg )
    tableHeader( explode( '|', "Rank|Person|Citizen of|WR|Best average|" ), array( 3 => 'class="R"', 4 => 'class="r"', 5 => 'class="f"' ));
  else
    tableHeader( explode( '|', "Rank|Person|Citizen of|WR|Best single|" ), array( 3 => 'class="R"', 4 => 'class="r"', 5 => 'class="f"' ));

  $curRank = 0;
  $incRank = 1;
  $wRank = 0;

  foreach( $preregs as $prereg ){
    extract( $prereg );

    #--- Check if the competitor is registered for the event
    $eventIdsList = explode( ' ', $eventIds );
    if (! in_array( $eventId, $eventIdsList ))
      continue;

    if( $worldRank == $wRank ){
      $incRank += 1;
    }
    else{
      $curRank += $incRank;
      $incRank = 1;
    }
    $wRank = $worldRank;

    #--- Compute the row.
    tableRow( array( $curRank, personLink( $personId, $name ), $countryId, $worldRank, formatValue( $best, valueFormat( $eventId )), '' ));
  }

  $curRank += $incRank;

  #--- New competitors
  foreach( $newPreregs as $newPrereg ){
    extract( $newPrereg );

    #--- Check if the competitor is registered for the event
    $eventIdsList = explode( ' ', $eventIds );
    if (! in_array( $eventId, $eventIdsList ))
      continue;

    #--- Compute the row.
    tableRow( array( $curRank, $personId ? personLink( $personId, $name ) : $name, $countryId, '', '', '' ));
  }

  tableEnd();

}

?>
