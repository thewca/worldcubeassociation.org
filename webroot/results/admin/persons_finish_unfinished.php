<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
analyzeChoices();
adminHeadline( 'Finish unfinished persons' );
showDescription();
showChoices();

if( $chosenCheck ) {
  getPersons();
  getBirthdates();
  showUnfinishedPersons();
}

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>In this script, a \"person\" always means a triple of id/name/countryId, and \"similar\" always means just name similarity. A person is called \"finished\" if it has a non-empty personId. A \"semi-id\" is the id without the running number at the end.</p>\n\n";

  echo "<p>For each unfinished person in the Results table, I show you the few most similar persons. Then you make choices and click \"update\" at the bottom of the page to show and execute your choices. You can:</p>\n\n";

  echo "<ul>\n";
  echo "  <li><p>Choose the person as \"new\", optionally modifying name, country and semi-id. This will add the person to the Persons table (with appropriately extended id) and change its Results accordingly. If this person has both roman and local names, the syntax for the names to be inserted correctly is 'romanName (localName)'.</p></li>\n";
  echo "  <li><p>Choose another person. This will overwrite the person's name/country/id in the Results table with those of the other person.</p></li>\n";
  echo "  <li><p>Skip it if you're not sure yet.</p></li>\n";
  echo "</ul>\n\n";

  echo "<p><span style='color:#F00;font-weight:bold'>Note:</span>I don't show more than 20 unfinished persons at once, so you might have to repeat checking and fixing a few times until there are no unfinished persons left.</p>\n";

  echo "<hr />\n";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCheck;

  $chosenCheck = getNormalParam( 'check' );
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    choiceButton( true, 'check', ' Check now ' )
  ));
}

#----------------------------------------------------------------------
function getPersons () {
#----------------------------------------------------------------------
  global $personsFromPersons, $personsFromResultsWithoutId;

  $personsFromResultsWithoutId = [];
  // when we are spliting wca profile, the person has an empty personId
  // when we are uploading results, the person has an digit only personId
  $persons = dbQueryHandle("
    SELECT Results.personId, Results.personName, Results.competitionId, Results.countryId, Competitions.year, InboxPersons.dob
    FROM Results
    LEFT JOIN Competitions ON Competitions.id=Results.competitionId
    LEFT JOIN InboxPersons ON InboxPersons.id=Results.personId and InboxPersons.competitionId=Results.competitionId
    WHERE personId='' OR personId REGEXP '^[0-9]+$'
    GROUP BY Results.personId, Results.personName, Results.competitionId, Results.countryId
    ORDER BY personName
  ");
  while( $row = mysql_fetch_array( $persons ))
    $personsFromResultsWithoutId[] = $row;
  mysql_free_result( $persons );

  $personsFromPersons = [];
  if (count( $personsFromResultsWithoutId )) {
    $persons = dbQueryHandle("
      SELECT id, name, countryId
      FROM Persons
      ORDER BY name
    ");
    while( $row = mysql_fetch_row( $persons ))
      $personsFromPersons[] = $row;
    mysql_free_result( $persons );
  }

}

#----------------------------------------------------------------------
function getBirthdates () {
#----------------------------------------------------------------------
  global $birthdates, $personsFromResultsWithoutId;

  $birthdates = [];
  if (count( $personsFromResultsWithoutId )) {
    $persons = dbQuery("
      SELECT  id, month, day, year
      FROM    Persons
    ");
    foreach( $persons as $person ){
      extract( $person );
      $birthdates[$id] = ($month || $day || $year)
                         ? ($year  ? sprintf("%02d",$year ) : '????') . '-' .
                           ($month ? sprintf("%02d",$month) : '??'  ) . '-' .
                           ($day   ? sprintf("%02d",$day  ) : '??'  )
                         : 'unknown';
    }
    $birthdates[''] = 'unknown';
  }
}

#----------------------------------------------------------------------
function showUnfinishedPersons () {
#----------------------------------------------------------------------
  global $personsFromPersons, $personsFromResultsWithoutId, $birthdates;

  #--- Pre-compute the candidate tuples: (id, name, countryId, romanName, romanNameSimilarityPlaceHolder, countryIdSimilarityPlaceHolder)
  $candidates = array();
  foreach( $personsFromPersons as $person ){
    list( $id, $name, $countryId ) = $person;
    $candidates[] = array( $id, $name, $countryId, extractRomanName($name), 0, 0 );
  }

  #--- Begin the form and table.
  echo "<form action='persons_finish_unfinished_ACTION.php' method='post'>";
  tableBegin( 'results', 8 );
  tableHeader( explode( '|', '|personName|countryId|personId|birthdate|personName|countryId|personSemiId' ),
               array( 6=>'class="6"' ) );

  #--- Walk over all persons from the Results table.
  $caseNr = 0;
  $availableSpots = array(); // array of semiIds in progress
  foreach( $personsFromResultsWithoutId as $person ){
    $name = $person['personName'];
    $countryId = $person['countryId'];
    $personId = $person['personId'];
    $firstYear = $person['year'];

    #--- Try to compute the semi-id.
    $paddingLetter = 'U';
    $neatName = strtoupper(preg_replace('/[^a-zA-Z ]/','',removeUglyAccentsAndStuff(extractRomanName($name))));
    $nameParts = explode(' ',$neatName);
    $lastName = $nameParts[count($nameParts)-1];
    $restOfName = implode(array_slice($nameParts,0,count($nameParts)-1));
    // follows a simple trick that prevents us from empty or too short restOfNames and provides the appropriate padding
    $restOfName = str_pad($restOfName,4,$paddingLetter);
    $lettersToShift = max(0,4-strlen($lastName));
    $cleared = false;
    while (!$cleared && $lettersToShift<=4) {
        $quarterId = substr($lastName,0,4-$lettersToShift) . substr($restOfName,0,$lettersToShift);
        $semiId = $firstYear . $quarterId;
        // update array of persons in progress
        if (!array_key_exists($semiId,$availableSpots)) {
            $lastIdTaken = dbQuery("SELECT id FROM Persons WHERE id LIKE '${semiId}__' ORDER BY id DESC LIMIT 1");
            if (!count($lastIdTaken)) {
                $counter = 0;
            } else {
                $counter = intval(substr($lastIdTaken[0]['id'],8,2));
            }
            $availableSpots[$semiId] = 99-$counter;
        }
        // is there a spot available?
        if ($availableSpots[$semiId]) {
            $availableSpots[$semiId]--;
            $cleared = true;
        } else {
            $lettersToShift++;
        }
    }
    /* The script has tried all the possibilities and none of them was valid.
     * If we reach here with $cleared set to false (something that is not going to happen in centuries) then
     * the person posting will receive an error in persons_finish_unfinished_ACTION.php and the software team
     * of the future will have work to do.
     */
    if (!$cleared) {
        // if we didn't clear a spot we stick with the first combination
        $lettersToShift = max(0,4-strlen($lastName));
        $semiId = $firstYear . substr($lastName,0,4-$lettersToShift) . substr($restOfName,0,$lettersToShift);
        $availableSpots[$semiId] = 0;
    }

    #--- Html-ify name and country.
    $nameHtml = htmlEscape( $name );
    $countryIdHtml = htmlEscape( $countryId );
    $personIdHtml = htmlEscape( $personId );
    $competitionId = htmlEscape( $person['competitionId'] );
    $dob = empty($person['dob']) ? 'yyyy-mm-dd' : $person['dob'];

    #--- Hidden field describing the case.
    $caseNr++;
    tableRowFull( "&nbsp;<input type='hidden' name='oldNameAndCountryAndPersonIdAndCompId$caseNr' value='$nameHtml|$countryIdHtml|$personIdHtml|$competitionId' />" );

    #--- Show the person.
    # Note that we set this input to checked, but if there's a better match
    # lower on, then it will take precendence.
    tableRowStyled( 'font-weight:bold', array(
      "<input type='radio' name='action$caseNr' value='new' checked='checked' />",
      visualize( $name ),
      visualize( $countryId ),
      peekLink( $name, $countryId, $personId ),
      $dob,
      "<input type='text' name='name$caseNr' value='$nameHtml' size='20' />",
      "<input type='text' name='country$caseNr' value='$countryIdHtml' size='20' />",
      "<input type='text' name='semiId$caseNr' value='$semiId' size='10' maxlength='8' />",
    ));

    #--- Show most similar persons.
    $similarsCtr = 0;
    foreach( getMostSimilarPersonsMax( extractRomanName($name), $countryId, $candidates, 10 ) as $similarPerson ){
      list( $other_id, $other_name, $other_countryId ) = $similarPerson;

      #--- If name and country match the unfinished persons, pre-select it.
      $checked = ($other_name==$name && $other_countryId==$countryId)
        ? "checked='checked'" : '';
      $style = $checked ? 'background-color: red' : '';

      #--- Skip the unfinished person itself.
      if( $checked && !$other_id )
        continue;

      #--- Html-ify.
      $nameHtml = htmlEscape( $other_name );
      $countryHtml = htmlEscape( $other_countryId );
      $idHtml = htmlEscape( $other_id );

      #--- Use "name|country|id" as action.
      $action = "$nameHtml|$countryHtml|$idHtml";

      #--- Show the other person.
      tableRowStyled( $style, array(
        "<input type='radio' name='action$caseNr' value='$action' $checked />",
#        ($other_id ? personLink( $other_id, $other_name ) : $other_name),
        visualize( $other_name ),
        visualize( $other_countryId ),
        ($other_id ? "<a class='p' href='../p.php?i=$other_id' target='_blank'>$other_id</a>" : peekLink( $other_name, $other_countryId, $other_id )),
        $birthdates[ $other_id ],
        '', #sprintf( "%.2f", $similarity ),
        '',
        '',
      ));

      #--- Stop after five similar persons.
      if( ++$similarsCtr == 5 )
        break;
    }

    #--- Offer an explicit skip.
    tableRow( array(
      "<input type='radio' name='action$caseNr' value='skip' />",
      'I\'m not sure yet', '', '', '', '', '', ''
    ));

    #--- Don't show more than 20 unfinished persons.
    if( $caseNr == 20 )
      break;
  }

  #--- Show 'Update' button, finish table and form.
  tableRowEmpty();
  tableRowFull( "<input type='submit' value='Update' />" );
  tableEnd();
  echo "</form>";
}

#----------------------------------------------------------------------
function removeUglyAccentsAndStuff ( $ugly ) {
#----------------------------------------------------------------------

    $accent   = "ÀÁÂÃÄÅÆĂÇĆČÈÉÊËÌÍÎÏİÐĐÑÒÓÔÕÖØÙÚÛÜÝÞřßŞȘŠŚşșśšŢȚţțŻŽźżžəàáâãäåæăąắặảầấạậāằçćčèéêëęěễệếềēểğìíîïịĩіıðđķКкŁłļñńņňòóôõöøỗọơốờőợồộớùúûüưứữũụűūůựýýþÿỳỹ";
    $noaccent = "aaaaaaaaccceeeeiiiiiddnoooooouuuuybrsssssssssttttzzzzzaaaaaaaaaaaaaaaaaaaccceeeeeeeeeeeegiiiiiiiiddkKklllnnnnoooooooooooooooouuuuuuuuuuuuuyybyyy";

    $nice = '';
    for( $i=0; $i<mb_strlen($ugly, 'UTF-8'); $i++ ){
      $chr = mb_substr($ugly, $i, 1, 'UTF-8');
      $j = mb_strpos($accent, $chr, 0, 'UTF-8');
      $nice .= ($j === FALSE) ? $chr : mb_substr($noaccent, $j, 1, 'UTF-8');
    }

    return $nice;
}

#----------------------------------------------------------------------
function getMostSimilarPersonsMax ( $romanName, $countryId, &$candidates, $max ) {
#----------------------------------------------------------------------

  #--- Compute similarities to all persons.
  $justSims = array();
  foreach( $candidates as &$candidate ) {
    similar_text( $romanName, $candidate[3], $candidate[4] );
    similar_text( $countryId, $candidate[2], $candidate[5] );
    $justSims[] = $candidate[4];
  }

  #--- Gather good candidates.
  rsort( $justSims );
  $goodCandidates = array();
  foreach( $candidates as $candidate )
    if( $candidate[4] >= $justSims[2 * $max] )
      $goodCandidates[] = $candidate;

  #--- Sort the good candidates and return the very best.
  usort( $goodCandidates, 'compareCandidates' );
  return array_slice( $goodCandidates, 0, $max );
}

#----------------------------------------------------------------------
function compareCandidates ( $a, $b ) {
#----------------------------------------------------------------------

  if( $a[4] > $b[4] ) return -1;
  if( $a[4] < $b[4] ) return 1;

  if( $a[5] > $b[5] ) return -1;
  if( $a[5] < $b[5] ) return 1;

  if( $a[0] ) return -1;
  if( $b[0] ) return 1;
#echo( "[$a[0]]" );
#echo( "($b[0])" );
  return 0;
}

#----------------------------------------------------------------------
function peekLink ( $name, $countryId, $personId ) {
#----------------------------------------------------------------------
  $N = urlencode( $name );
  $C = urlencode( $countryId );
  $I = urlencode( $personId );
  return "<a href='persons_finish_unfinished_peek_at_results.php?name=$N&countryId=$C&personId=$I' target='_blank'>(results)</a>";
}
