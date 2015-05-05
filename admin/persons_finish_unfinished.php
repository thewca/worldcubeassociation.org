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

  echo "<p><span style='color:#F00;font-weight:bold'>Note:</span> For time reasons I don't show more than 20 unfinished persons at once, so you might have to repeat checking and fixing a few times until there are no unfinished persons left.</p>\n";
  
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

  $persons = dbQueryHandle("
    SELECT id, name, countryId
    FROM Persons
    ORDER BY name
  ");
  while( $row = mysql_fetch_row( $persons ))
    $personsFromPersons[] = $row;
  mysql_free_result( $persons );

  $persons = dbQueryHandle("
    SELECT DISTINCT personName, Results.countryId, year
    FROM Results
    JOIN Competitions ON Competitions.id=Results.competitionId
    WHERE personId=''
    ORDER BY personName
  ");
    while( $row = mysql_fetch_row( $persons ))
      $personsFromResultsWithoutId[] = $row;
    mysql_free_result( $persons );

}

#----------------------------------------------------------------------
function getBirthdates () {
#----------------------------------------------------------------------
  global $birthdates;

  $persons = dbQuery("
    SELECT  id, month, day, year
    FROM    Persons
  ");
  foreach( $persons as $person ){
    extract( $person );
    $birthdates[$id] = ($month || $day || $year)
                       ? ($month ? sprintf("%02d",$month) : '??'  ) . '/' .
                         ($day   ? sprintf("%02d",$day  ) : '??'  ) . '/' .
                         ($year  ? sprintf("%02d",$year ) : '????')
                       : 'unknown';
  }
  $birthdates[''] = 'unknown';
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
  foreach( $personsFromResultsWithoutId as $person ){
    list( $name, $countryId, $firstYear ) = $person;
    
    #--- Try to compute the semi-id.
    $quarterId = removeUglyAccentsAndStuff( extractRomanName( $name ));
    $quarterId = preg_replace( '/[^a-zA-Z ]/', '', $quarterId );
    $semiId = $firstYear . strtoupper( substr( preg_replace( '/(.*)\s(.*)/', '$2$1', $quarterId ), 0, 4 ));

    #--- Html-ify name and country.
    $nameHtml = htmlEscape( $name );
    $countryIdHtml = htmlEscape( $countryId );

    #--- Hidden field describing the case.
    $caseNr++;
    tableRowFull( "&nbsp;<input type='hidden' name='oldNameAndCountry$caseNr' value='$nameHtml|$countryIdHtml' />" );
    
    #--- Show the person.
    tableRowStyled( 'font-weight:bold', array(
      "<input type='radio' name='action$caseNr' value='new' />",
      visualize( $name ),
      visualize( $countryId ),
      peekLink( $name, $countryId ),
      'mm/dd/yyyy',
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
      tableRow( array(
        "<input type='radio' name='action$caseNr' value='$action' $checked />",
#        ($other_id ? personLink( $other_id, $other_name ) : $other_name),
        visualize( $other_name ),
        visualize( $other_countryId ),
        ($other_id ? "<a class='p' href='../p.php?i=$other_id' target='_blank'>$other_id</a>" : peekLink( $other_name, $other_countryId )),
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

    $accent   = "ÀÁÂÃÄÅÆĂÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßŞȘşșŢȚţțàáâãäåæăçèéêëìíîïðñòóôõöøùúûýýþÿ";
    $noaccent = "aaaaaaaaceeeeiiiidnoooooouuuuybsssssttttaaaaaaaaceeeeiiiidnoooooouuuyyby";

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
function peekLink ( $name, $countryId ) {
#----------------------------------------------------------------------
  $N = urlencode( $name );
  $C = urlencode( $countryId );
  return "<a href='persons_finish_unfinished_peek_at_results.php?name=$N&countryId=$C' target='_blank'>(results)</a>";
}
