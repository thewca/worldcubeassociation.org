<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );
analyzeChoices();
echo "<p><a href='./'>Administration</a> &gt;&gt; <b>Check results</b> (" . wcaDate() . ")</p>\n";
showDescription();

if( $chosenCheckRecent || $chosenCheckAll ){
  showChoices();
  if ( $chosenCheckRecent )
    $dateCondition = "AND (year*10000+month*100+day >= CURDATE() - INTERVAL 3 MONTH)";
  checkResults();
} else {
  echo "<p style='color:#F00;font-weight:bold'>I haven't done any checking yet, choose what you want to check...</p>";
  showChoices();
}

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p style='width:45em'>Checks results according to our <a href='check_results.txt'>checking procedure</a>. Usually you should check only the recent results (past three months), it's faster and it hides exceptions that shall remain (once they're old enough).</p>\n";

  echo "<hr />\n";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCheckRecent, $chosenCheckAll;

  $chosenCheckRecent = getBooleanParam( 'checkRecent' );
  $chosenCheckAll    = getBooleanParam( 'checkAll' );
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    choiceButton( true, 'checkRecent', 'check recent' ),
    choiceButton( true, 'checkAll', 'check all' ),
  ));
}

#----------------------------------------------------------------------
function checkResults () {
#----------------------------------------------------------------------
  global $dateCondition, $chosenCheckAll, $competitionIds, $countryIds;

  echo "<p>Checking <b>" . ($chosenCheckAll ? 'all' : 'recent') . "</b> results...</p>\n";

  #--- Get all results (id, values, format, round).
  $dbResult = mysql_query("
    SELECT
      result.id, formatId, roundId, personId, competitionId, eventId, result.countryId,
      value1, value2, value3, value4, value5, best, average
    FROM Results result, Competitions competition
    WHERE competition.id = competitionId
      $dateCondition
    ORDER BY formatId, competitionId, eventId, roundId, result.id
  ")
    or die("<p>Unable to perform database query.<br/>\n(" . mysql_error() . ")</p>\n");

  #--- Build Id arrays
  $countryIds = array_flip( getAllIDs( dbQuery( "SELECT id FROM Countries" )));
  $competitionIds = array_flip( getAllIDs( getAllCompetitions()));

  #--- Process the results.
  $badIds = array();
  echo "<pre>\n";
  while( $result = mysql_fetch_array( $dbResult )){
    if( $error = checkResult( $result )){
      extract( $result );
      echo "Error: $error\nid:$id format:$formatId round:$roundId";
      echo " ($value1,$value2,$value3,$value4,$value5) best+average($best,$average)\n";
      echo "$personId   $countryId   $competitionId   $eventId\n\n";
      $badIds[] = $id;
    }
  }

  #--- Free the results.
  mysql_free_result( $dbResult );

  #--- Print query to get all results with errors.
  echo count( $badIds ) . " errors found. Get them with this:<br />\n";
  echo "SELECT * FROM Results WHERE id in (" . implode( ',', $badIds ) . ")";
  echo "</pre>";
}

#----------------------------------------------------------------------
function checkResult ( $result ) {
#----------------------------------------------------------------------
  global $competitionIds, $countryIds;

  $format = $result['formatId'];

  #--- 1) Let dns, dnf, zero, suc be the number of values of each kind.
  foreach( range( 1, 5 ) as $i ){
    $value = $result["value$i"];
    $dns += $value == -2;
    $dnf += $value == -1;
    $zer += $value == 0;
    $suc += $value > 0;
  }

  #--- 2) Check that no zero value is followed by a non-zero value.
  foreach( range( 1, 4 ) as $i )
    if( $result["value$i"] == 0  &&  $result["value".($i+1)] != 0 )
      return "Zero must not be followed by non-zero.";

  #--- 3) Check zer<5 (there must be at least one non-zero value)
  if( $zer == 5 )
    return "There must be at least one non-zero value";

  #--- 4) Check dns+dnf+zer+suc=5 (nothing besides these is allowed)
  if( $dns + $dnf + $zer + $suc != 5 )
    return "Invalid value";

  #--- 5) Sort the successful values into v_1 .. v_suc
  $v = array();
  foreach( range( 1, 5 ) as $i ){
    $value = $result["value$i"];
    if( $value > 0 )
      $v[] = $value;
  }
  sort( $v );
  array_unshift( $v, 0 );

  #--- 6) compute best
  $best = ($suc > 0) ? $v[1] : (($dnf > 0) ? -1 : -2);

  #--- 7) compute average
  $average = 0;
  if( $format == 'm'   ) $average = ($zer > 2) ? 0 : (($suc < 3) ? -1 : round(($v[1] + $v[2] + $v[3]) / 3));
  if( $format == 'a'   ) $average = ($zer > 0) ? 0 : (($suc < 4) ? -1 : round(($v[2] + $v[3] + $v[4]) / 3));
  if( $average > 60000 ) $average = ($average + 50 - (($average + 50) % 100));

  #--- 8) compare the computed best and average with the stored ones
  if( $result['best']    != $best    ) return    "'best' should be $best";
  if( $result['average'] != $average ) return "'average' should be $average";

  #--- 9) check number of zero values for non-combined rounds
  $round = $result['roundId'];
  if ( $round != 'c'  &&  $round != 'd'  &&  $round != 'e'  &&  $round != 'g' ) {
    if( $format == '1'  &&  $zer != 4 ) return "should have one non-zero value";
    if( $format == '2'  &&  $zer != 3 ) return "should have two non-zero values";
    if( $format == '3'  &&  $zer != 2 ) return "should have three non-zero values";
    if( $format == 'm'  &&  $zer != 2 ) return "should have three non-zero values";
    if( $format == 'a'  &&  $zer != 0 ) return "shouldn't have zero-values";
  }
  #--- 10) same for combined rounds
  else {
    if( $format == '2'  &&  $zer < 3 ) return "should have at most two non-zero values";
    if( $format == '3'  &&  $zer < 2 ) return "should have at most three non-zero values";
    if( $format == 'm'  &&  $zer < 2 ) return "should have at most three non-zero values";
  }

  #--- 11) check times over 10 minutes
  if( valueFormat( $result['eventId'] ) == 'time' )
    foreach( range( 1, 5 ) as $i ){
      $value = $result["value$i"];
      if(( $value > 60000 ) && ( $value % 100 ))
        return "$value should be rounded";
  }


  #--- 12) check for existing countryId
  if( ! isset( $countryIds[$result['countryId']] ))
    return "unknown country " . $result['countryId'];

  #--- 13) check for existing competitionId
  if( ! isset( $competitionIds[$result['competitionId']] ))
    return "unknown competition " . $result['competitionId'];

}

?>
