<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'statistics';

require( '../_header.php' );

showBody();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showBody () {
#----------------------------------------------------------------------

  $singleYoungs  =                extractLowest( 'best',    'ASC' );
  $averageYoungs =                extractLowest( 'average', 'ASC' );
  $singleOldies  = array_reverse( extractLowest( 'best',    'DESC' ) );
  $averageOldies = array_reverse( extractLowest( 'average', 'DESC' ) );

  #--- Pad the lists so they're the same length
  $empty = array( '', '', '', '' );
  $singleYoungs  = array_pad( $singleYoungs,  -count($averageYoungs), $empty );
  $averageYoungs = array_pad( $averageYoungs, -count($singleYoungs ), $empty );
  $singleOldies  = array_pad( $singleOldies,   count($averageOldies), $empty );
  $averageOldies = array_pad( $averageOldies,  count($singleOldies ), $empty );

  #--- Mark the current single and average world records
  $singleOldies[0][]  = 'WR';
  $averageOldies[0][] = 'WR';

  #--- Merge youngs and oldies
  $singles  = array_merge( array_slice( $singleYoungs,  0, -1 ), $singleOldies  );
  $averages = array_merge( array_slice( $averageYoungs, 0, -1 ), $averageOldies );

  #--- Output the page header.
  echo "<h1>Age vs Speed</h1>\n\n";
  echo "<p style='padding-left:20px;padding-right:20px;font-weight:bold'>This is an analysis of age vs speed for solving the 3x3x3, both single and average. The list is made so that between two consecutive entries, there's nobody with age and record in between.</p>";
  echo "<p style='padding-left:20px;padding-right:20px;color:gray;font-size:10px'>Generated on " . wcaDate() . ".</p>";

  #--- Output the table header
  TableBegin( 'results', 8 );
  TableHeader( array('Age','Single','Name','|','Age','Average','Name',''),
               array( 'class="r"','class="r"','class="p"', 'class="L"',
                      'class="r"','class="r"','class="p"', 'class="f"' ) );

  #--- Output the table contents
  foreach ( $singles as $s ) {
    $a = array_shift( $averages );
    TableRow( array_merge( formatAgeTimePerson( $s, '|' ),
                           formatAgeTimePerson( $a, '' ) ) );
  }

  #--- Output the table end
  TableEnd();
}

#----------------------------------------------------------------------
function formatAgeTimePerson ( $ageTimePerson, $ender ) {
#----------------------------------------------------------------------
  list( $personId, $personName, $ageInDays, $value, $wr ) = $ageTimePerson;
  if ( ! $personName ) return array( '', '', '', $ender );
  return array( wr($wr, sprintf("$a%.2f years$b",$ageInDays/365.25) ),
                wr($wr, formatValue($value) ),
                personLink( $personId, $personName ),
                $ender);
}

function wr ( $wr, $text ) {
  return $wr ? "<b>$text</b>" : $text;
}

#----------------------------------------------------------------------
function extractLowest ( $sourceId, $ageOrder ) {
#----------------------------------------------------------------------

  $rows = dbQuery( "
    SELECT    personId,
              personName,
              datediff( c.year*10000+c.month*100+c.day, p.year*10000+p.month*100+p.day ) ageInDays,
              min($sourceId) value
    FROM      Results r,
              Persons p,
              Competitions c
    WHERE     p.id = personId
      AND     c.id = competitionId
      AND     eventId = '333' AND $sourceId>0
      AND     p.year AND p.month AND p.day
      AND     c.year AND c.month AND c.day
    GROUP BY  personId, competitionId
    ORDER BY  ageInDays $ageOrder, value
  " );

  foreach ( $rows as $row ) {
    list( $personId, $personName, $ageInDays, $value ) = $row;
    if ( ! $lowest || $value < $lowest ) {
      $lowest = $value;
      $result[] = $row;
    }
  }
  return $result;
}

?>