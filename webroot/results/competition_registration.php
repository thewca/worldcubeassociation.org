<?php

if( preg_match( '/competition_registration.php/', $_SERVER['PHP_SELF'] ))
  $standAlone = true;

if( $standAlone ){
  require_once( 'includes/_framework.php' );
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
<body><?php

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
  ?></body></html><?php
}

#----------------------------------------------------------------------
function showPreregForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $competition, $persons;

  $chosenCountry = $competition['countryId'];

  if( getBooleanParam( 'search' )){
    $chosenPattern = getMysqlParam( 'name' );
    $chosenName    = getHtmlParam(  'name' );
    
    $nameCondition = '';
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
    $chosenEmail   = '';
    $chosenGuests  = '';
    $chosenComments= '';

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

  echo "<p style='width:90%;margin:1em auto 1em auto;'>Please note that the purpose of the preregistration is not only to reserve you a spot in the competition, but also very importantly to give the organizers a good estimation of the number of people they have to expect. Please don't wait until the very last minute to preregister, otherwise the organizers might not be able to offer enough room, food, etc.</p>";
  
  echo "<p style='width:90%;margin:1em auto 1em auto;'>If you already have participated in an official competition, you can use the search function which will fill the information stored in the database. You can then fill the rest.</p>";

  echo "<form method='POST'>";
  showField( "competitionId hidden $chosenCompetitionId" );
  showField( "form hidden 1" );
  echo "<table class='prereg'>";
  if( isset( $chosenPersonId ))
    showField( "personId readonly $chosenPersonId 11 <b>WCA Id</b>" );

  if( ! isset( $chosenName ))
    $chosenName = "";
  if( getBooleanParam( 'new' )) {
    showField( "name text $chosenName 50 <b>Name</b>" );
    echo "<tr><td>&nbsp;</td><td>Enter your name <b>correctly</b>, for example \"<span style='color:#393;font-weight:bold'>Stefan Pochmann</span>\". Not sloppily like \"<span style='color:#c00;font-weight:bold'>s pochman</span>\".</td></tr>";
  } else
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
<?php
  
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
    if( count( dbQuery( "SELECT * FROM Events WHERE id='$eventId' AND rank<990" )))
      echo " <label for='$id'>$eventName$timeLimit</label><br />";
    else
      echo " <label for='$id' style='color:#999'>$eventName$timeLimit</label><br />";
  }
}

#----------------------------------------------------------------------
function savePreregForm () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $competition, $config;
 
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

  if( !preg_match( "/^[_0-9a-zA-Z-]+(\.[_0-9a-zA-Z-]+)*@[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*(\.[a-zA-Z]{2,3})$/", $email )){
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
  $eventIds = '';
  foreach( getAllEventIds() as $eventId ){
    if( getBooleanParam( "E$eventId" ))
      $eventIds .= "$eventId ";
  }
  rtrim( $eventIds ); # Remove last space

  $into = "competitionId, name, personId, countryId, gender, birthYear, birthMonth, birthDay, email, guests, comments, ip, status, eventIds";
  $values = "'$chosenCompetitionId', '$name', '$personId', '$countryId', '$gender', '$birthYear', '$birthMonth', '$birthDay', '$email', '$guests', '$comments', '$ip', 'p', '$eventIds'";
  
  dbCommand( "INSERT INTO Preregs ($into) VALUES ($values)" );

  $organizers = getCompetitionOrganizers($competition['id']);
  foreach($organizers as $organizer) {
    $mailEmail = $organizer['email'];

    // load more competition data for a nicer email
    $result = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );
    $competition_data = $result[0];


    $mailBody = "A new competitor has registered for your competition - ".$competition['cellName']."! ";
    $mailBody .= "Their information is below.\n-------------------\n";
    if($personId) {
      $mailBody .= "Name : $name";
      $mailBody .= "     $personId - https://www.worldcubeassociation.org/results/p.php?i=$personId\n";
    } else {
      $mailBody .= "Name : $name\n";
    }
    $mailBody .= "Country : $countryId\n";
    $mailBody .= "Gender : $gender\n";
    $mailBody .= "Date of birth : $birthYear/$birthMonth/$birthDay\n";
    $mailBody .= "Email : $email\n";
    $mailBody .= "Events : $eventIds\n";
    $mailBody .= "Guests : $guests\n";
    $mailBody .= "Comments : $comments\n";
    $mailBody .= "Ip : $ip\n";
    $mailBody .= "-------------------\n";
    $mailBody .= "You may edit this registration (and others) at:\n";
    $mailBody .= "http://www.worldcubeassociation.org/competitions/$chosenCompetitionId/registrations";

    $mailSubject = $competition['cellName'] . " - New registration";

    $mail_config = $config->get('mail');

    // only send mails on the real website
    if(preg_match( '/^www.worldcubeassociation.org$/', $_SERVER["SERVER_NAME"])) {
      if($mail_config['pear']) {
        // send smtp mail
        $headers = array ('From' => $mail_config['from'],
         'To' => $mailEmail,
         'Subject' => $mailSubject);

        $smtp = Mail::factory('smtp',
          array ('host' => $mail_config['host'],
           'port' => $mail_config['port'],
           'auth' => true,
           'username' => $mail_config['user'],
           'password' => $mail_config['pass'])
        );

        $mail = $smtp->send($mailEmail, $headers, $mailBody);

      } else {
        // normal php mail
        $mailHeaders = "From: \"WCA\" <" . $mail_config['from'] . ">\r\n";
        $mailHeaders .= "Reply-To: board@worldcubeassociation.org\r\n";
        $mailHeaders .= "MIME-Version: 1.0\r\n";
        $mailHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";

        mail( $mailEmail, $mailSubject, $mailBody, $mailHeaders, "-f" . $mail_config['from'] );
      }
    } else {
      // just print out message when testing
      noticeBox3(0, "Mail not sent (test website): " . $mailBody);
    }

  }

  noticeBox( true, "Registration complete.<br />Please note that all registrations must be approved by the organizer.<br/>Your registration will appear here within a few days." );
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
  $countCountry = 0;

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

  #--- What's first, single or average?
  $order = count(dbQuery("SELECT * FROM Results WHERE eventId='$eventId' AND formatId in ('a','m') LIMIT 1"))
         ? array('Average', 'Single') : array('Single', 'Average');

  #--- Get singles, averages and preregs.
  $score1 = array();
  foreach( dbQuery("SELECT personId, best, worldRank FROM Ranks{$order[0]} WHERE eventId='$eventId'") as $row )
    $score1[$row['personId']] = array($row['best'], $row['worldRank']);
  $score2 = array();
  foreach( dbQuery("SELECT personId, best, worldRank FROM Ranks{$order[1]} WHERE eventId='$eventId'") as $row )
    $score2[$row['personId']] = array($row['best'], $row['worldRank']);
  $preregs = dbQuery("
    SELECT personId, name, countryId
    FROM   Preregs
    WHERE  competitionId = '$chosenCompetitionId'
      AND  status = 'a'
      AND  eventIds rlike '[[:<:]]{$eventId}[[:>:]]'
  ");

  #--- Add singles, averages and a comparison key to the preregs.
  foreach( $preregs as &$prereg ){
    extract( $prereg );
    $prereg['score1'] = isset($score1[$personId]) ? $score1[$personId] : array(0, 0);  # PHP suuuucks
    $prereg['score2'] = isset($score2[$personId]) ? $score2[$personId] : array(0, 0);
    $s1 = isset($score1[$personId]) ? $score1[$personId][1] : 999999999;
    $s2 = isset($score2[$personId]) ? $score2[$personId][1] : 999999999;
    $prereg['cmpKey'] = sprintf('%09d%09d', $s1, $s2);
  }
  unset($prereg);  # Because otherwise PHP is a weirdo and messes up the table-foreach below.

  #--- Sort the preregs.
  usort($preregs, function($a, $b) {
    return strcmp($a['cmpKey'], $b['cmpKey']);
  });

  #--- Show the preregs table.
  tableBegin( 'results', 8);
  tableCaption( false, eventName( $eventId ));
  tableHeader( explode( '|', "Rank|Person|Citizen of|Best {$order[0]}|WR|Best {$order[1]}|WR|" ), array( 0 => 'class="r"', 3 => 'class="R"', 4 => 'class="R"', 5 => 'class="r"', 6 => 'class="r"', 7 => 'class="f"' ));
  $ctr = 0;
  $lastCmpKey = '';
  foreach( $preregs as $prereg ){
    extract( $prereg );
    $ctr++;
    $rank = ($cmpKey > $lastCmpKey) ? $ctr : '';
    $lastCmpKey = $cmpKey;
    tableRow( array( $rank,
                     $personId ? personLink( $personId, $name ) : $name,
                     $countryId,
                     formatValue( $score1[0], valueFormat( $eventId )), $score1[1],
                     formatValue( $score2[0], valueFormat( $eventId )), $score2[1], '' ));
  }
  tableEnd();
}

?>
