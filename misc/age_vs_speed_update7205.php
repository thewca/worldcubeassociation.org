<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'misc';

ob_start();
require( '../includes/_header.php' );

#--- Output the page header.
echo "<h1>Age vs Speed</h1>\n\n";
echo "<p style='padding-left:20px;padding-right:20px;font-weight:bold'>This is an analysis of age vs speed. It shows the lowest times achieved at different ages, and is complete in the sense that between two consecutive entries, there's nobody with age and record in between. The current single and average world record are highlighted, and the two lists are adjusted so that those two records are on the same row.</p>";
echo "<p style='padding-left:20px;padding-right:20px;color:gray;font-size:10px'>Generated on " . wcaDate() . ".</p>";

if( ! file_exists( 'age_vs_speed' ) )
  mkdir( 'age_vs_speed' );

$events = dbQuery( "
  SELECT    id, name
  FROM      Events
  WHERE     format='time' and rank<999
  ORDER BY  rank
" );
foreach ( $events as $event )
  showBody( $event['id'], $event['name'] );

require( '../includes/_footer.php' );
$html = ob_get_clean();
$html = preg_replace( "/'p.php/", "'../p.php", $html );
echo $html;
if ( ! wcaDebug() )
  file_put_contents( 'age_vs_speed.html', $html );

#----------------------------------------------------------------------
function showBody ( $eventId, $eventName ) {
#----------------------------------------------------------------------

  if ( $eventId == '333' )
    echo "<h3>$eventName</h3>";
  
  #--- Get the four partial lists of values personId/personName/ageInDays/value
  $singleYoungs  =                extractLowest( $eventId, 'best',    'ASC' );
  $averageYoungs =                extractLowest( $eventId, 'average', 'ASC' );
  $singleOldies  = array_reverse( extractLowest( $eventId, 'best',    'DESC' ) );
  $averageOldies = array_reverse( extractLowest( $eventId, 'average', 'DESC' ) );

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

  #--- Create and include the diagram image
  $imageFile = "age_vs_speed/$eventId.png";
  createDiagramImage( $eventName, $imageFile, $singles, $averages );
  echo "<img src='$imageFile' />";

  if ( $eventId != '333' )
    return;
  
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
  return array( wr($wr, sprintf("$a%.1f",$ageInDays/365.25) ),
                wr($wr, formatValue($value) ),
                personLink( $personId, $personName ),
                $ender);
}

function wr ( $wr, $text ) {
  return $wr ? "<b>$text</b>" : $text;
}

#----------------------------------------------------------------------
function extractLowest ( $eventId, $sourceId, $ageOrder ) {
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
      AND     eventId = '$eventId' AND $sourceId>0
      AND     p.year AND p.month AND p.day
      AND     c.year AND c.month AND c.day
    GROUP BY  personId, competitionId
    ORDER BY  ageInDays $ageOrder, value
  " );

  $result = array();
  foreach ( $rows as $row ) {
    list( $personId, $personName, $ageInDays, $value ) = $row;
    if ( ! $lowest || $value < $lowest ) {
      $lowest = $value;
      $result[] = $row;
    }
  }
  return $result;
}

#----------------------------------------------------------------------
function createDiagramImage ( $eventName, $imageFile, $singles, $averages ) {
#----------------------------------------------------------------------

  require_once ("../thirdparty/jpgraph/jpgraph.php");
  require_once ("../thirdparty/jpgraph/jpgraph_line.php");
   
  // Create the graph
  $graph = new Graph( 860, 300 );
  
  #--- Add the line plots for average and single
  $min = $minAge = 999999; $max = $maxAge = 0; 
  foreach ( array( array( 'average', 'red', $averages ), array( 'single', 'blue', $singles ) ) as $lineData ) {
    list( $name, $color, $rows ) = $lineData;
    
    // Gather the data
    $xdata = array();
    $ydata = array();
    foreach ( $rows as $row ) {
      list( $personId, $personName, $ageInDays, $value, $wr ) = $row;
      if ( $ageInDays ) {
        $ageInYears = $ageInDays / 365.25;
        $v = $value / 100;
        $xdata[] = $ageInYears;
        $ydata[] = $v;
        $min = min( $min, $v );
        $max = max( $max, $v );
        $minAge = min( $minAge, $ageInYears );
        $maxAge = max( $maxAge, $ageInYears );
      }
    }    
    if ( count( $xdata ) == 0 )
      continue;

    // Create the linear plot
    $lineplot=new LinePlot( $ydata, $xdata );
    $lineplot->SetColor( $color );
    $lineplot->SetLegend( "$eventName $name" );
    
    $lineplot->mark->SetType( MARK_FILLEDCIRCLE );
    $lineplot->mark->SetFillColor( $color);
    $lineplot->mark->SetWidth( 3 );
    
    // Add the plot to the graph
    $graph->Add( $lineplot );
  }

  $graph->SetScale( 'linlin', floor($min*0.0), min($min*7, $max), floor( $minAge-0.1), $maxAge+0.1 );
  $graph->SetMargin( 35, 10, 10, 25 );
  #$graph->img->SetAntiAliasing();
  $graph->legend->SetPos(0.5,0.05,'center','top');
  
  // Store as image file
  if ( file_exists( $imageFile ) )
    unlink( $imageFile );
  $graph->Stroke( $imageFile );

}

?>