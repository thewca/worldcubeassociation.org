<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'misc';
require( '../../includes/_header.php' );

$onlyProvideFunctions = true;
require( '../../includes/statistics/sum_of_ranks.php' );

analyzeChoices();
tryCache( 'sum_of_ranks', preg_replace( '/ /', '', $chosenRegionId ), $chosenSingle, $chosenAverage );
echo "<h1>Sum of Ranks</h1>\n\n";
echo "<p style='padding-left:20px;padding-right:20px;font-weight:bold'>Top 300 by sum of ranks for each region. Top-10 ranks are marked green, if someone doesn't have a rank it's the number of people with a rank, plus 1 (and marked red)</p>";
offerChoices();
echo "<p style='padding-left:20px;padding-right:20px;color:gray;font-size:10px'>Generated on " . wcaDate() . ".</p>";
showResults();

require( '../../includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenRegionId;
  global $chosenSingle, $chosenAverage;

  $chosenRegionId = getNormalParam( 'regionId' );

  $chosenSingle   = getBooleanParam( 'single' );
  $chosenAverage  = getBooleanParam( 'average' );

  if( ! $chosenAverage )
    $chosenSingle = true;
}

#----------------------------------------------------------------------
function offerChoices () {
#----------------------------------------------------------------------
  global $chosenSingle, $chosenAverage;

  displayChoices( array(
    regionChoice( false ),
    array(
      choiceButton( $chosenSingle,  'single', 'Single' ),
      choiceButton( $chosenAverage, 'average', 'Average' )
    ),
  ));
}

#----------------------------------------------------------------------
function showResults () {
#----------------------------------------------------------------------
  global $chosenRegionId, $chosenSingle, $chosenAverage;

  #------------------------------
  # Prepare stuff for the query.
  #------------------------------

  $regionCondition = regionCondition( 'result' );
  $limitCondition = 'LIMIT 120';

  $valueSource = $chosenAverage ? 'average' : 'best';
  $valueName   = $chosenAverage ? 'Average' : 'Single';

  #------------------------------
  # Get results from database.
  #------------------------------

  $limitNumber = 300;
  $ranks = getRanks($valueName, $chosenRegionId);
  list( $rows, $header ) = sumOfRanks($valueName, getAllEventIds(), $ranks, $limitNumber+20);
  $header = preg_replace('/ +/', '|', preg_replace('/\\[\w+\\]/', '', "Rank $header "));

  foreach (dbQuery("SELECT id, name FROM Persons WHERE subId=1") as $person)
    $personName[$person[0]] = $person[1];

  #------------------------------
  # Show the table.
  #------------------------------
  $numColumns = count($rows[0]) + 2;
  $headerAttributes = array( 0=>"class='r'", 2=>"class='R2'", $numColumns-1=>'class="f"' );
  for ($i=3; $i<$numColumns-1; $i++)
    $headerAttributes[$i] = "class='r'";
  tableBegin( 'results', $numColumns );
  tableCaption( true, chosenRegionName(true));
#  tableHeader( explode( '|', $header), $headerAttributes );

  $ctr = $previousSumOfRanks = 0;
  $showHeader = true;
  foreach( $rows as $row ){
    $showHeader |= $ctr % 20 == 0;
    list($personId, $sumOfRanks) = $row;
    $ctr++;
    $no = ($sumOfRanks == $previousSumOfRanks) ? '' : $ctr;
    if( $limitCondition  &&  $no > $limitNumber )
      break;
    if ($showHeader && $no) {
      tableHeader( explode( '|', $header), $headerAttributes );
      $showHeader = false;
    }
    for ($i=2; $i<$numColumns-2; $i++)
      if (preg_match('/^(10|[1-9])$/', $row[$i]))
        $row[$i] = "<span style='color:#0D0'>$row[$i]</span>";
    $row[0] = personLink( $row[0], $personName[$row[0]] );
    $row[] = '';
    array_unshift($row, $no);
    tableRow( $row );
    $previousSumOfRanks = $sumOfRanks;
  }

  tableEnd();
}

?>
