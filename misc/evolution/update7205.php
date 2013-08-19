<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'misc';
$extraHeaderStuff = '<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js" type="text/javascript"></script>'."\n"           # See http://jquery.com/download/
                  . '<script src="../../js/highcharts.js" type="text/javascript"></script>'."\n"                                               # See http://code.highcharts.com/
                  . '<link type="text/css" href="jquery-ui-1.8.24.tabs/css/ui-lightness/jquery-ui-1.8.24.custom.css" rel="stylesheet" />'."\n" # See jquery-ui-1.8.24.custom/README.md
                  . '<script type="text/javascript" src="jquery-ui-1.8.24.tabs/js/jquery-ui-1.8.24.custom.min.js"></script>'."\n"              # See jquery-ui-1.8.24.custom/README.md
                  . '<script src="charts_data.js" type="text/javascript"></script>'."\n"                                                       # Our computed data
                  . "<script type='text/javascript'> $(function(){ $('#tabs').tabs(); }); </script>\n";                                        # Starting jQuery
ob_start();
require( '../../includes/_header.php' );

# TODO: speed it up
# TODO: clean up
# TODO: include old multi in gray on the new multi image?
# TODO: end(array) statt array[count-1]?
# TODO: make the tabs linkable/bookmarkable (and with nice anchors), look at http://blog.rootsmith.ca/jquery/how-to-make-jquery-ui-tabs-linkable-or-bookmarkable/ and http://jqueryui.com/demos/tabs/
# TODO: Date in days since sometime 2003 for short exact encoding?
# TODO: http://code.jquery.com/jquery-latest.js as shown on http://twitter.github.com/bootstrap/getting-started.html
#    or http://code.jquery.com/jquery.min.js    as shown on http://code.jquery.com/
# TODO: very short encoding: "5,4 7,3" meaning two points, one 5 days and 0.04s since the previous, then another 7 more days and 0.03s more
# TODO: For 1 and 10, maybe show the person name as well? But for 1st place, make sure you get the right one in case of a WR tie on the same day. And no, the new 10th place person might've just been bumped up from place 9 by someone else, so he became 10th without doing anything. So only do this for world record if at all.
# TODO: reply to this? http://www.speedsolving.com/forum/showthread.php?26121-Odd-WCA-stats-Stats-request-Thread&p=616708&viewfull=1#post616708

#--- Output the page header.
echo "<h1>Evolution of Records</h1>\n\n";
echo "<p style='padding-left:20px;padding-right:20px;font-weight:bold'>This page shows how records evolved, both average and single, and not just the world record (place 1) at the time but also places 10 and 100. Records are considered at the end of the day, and the first day of the competition is assumed. Thus some values might be slightly off, but this page is just intended to show the big picture anyway.</p>";
echo "<p style='padding-left:20px;padding-right:20px;color:gray;font-size:10px'>Generated on " . wcaDate() . ".</p>";

echo "<p></p>";

#--- Define what to show in what order and with nice short names
$whats = explode( ' ', '333:3x3 444:4x4 555:5x5 222:2x2 333bf:bld 333oh:hand 333fm:moves:1 333ft:feet minx:mega pyram:pyra sq1:sq1 clock:clock 666:6x6 777:7x7 magic:magic mmagic:master 444bf:4bld 555bf:5bld 333mbf:multi:1' );
#$whats = explode( ' ', '444:4x4 555:5x5 222:2x2' );
#$whats = explode( ' ', '333fm:moves:1 444:4x4 magic:magic mmagic:master 333mbf:multi:1' );
#$whats = explode( ' ', '333fm:moves:1 333mbf:multi:1' );
#$whats = explode( ' ', '555:5x5 magic:magic' );
#$whats = explode( ' ', 'magic:magic' );

#--- Build and store the javascript for the graphs, and add links/containers to the page
$eventChartsJs = <<<EOD
$(function () { $(document).ready(function() {
function formatValue(value, divide, showCentis) {
  if (divide == 1)
    return value;
  var minutes = Math.floor(value / 6000);
  var seconds = Math.floor(value / 100) % 60;
  var centis  = value % 100;
  if (minutes > 0 && seconds < 10) seconds = '0' + seconds;
  if (centis < 10) centis = '0' + centis;
  return (minutes > 0 ? minutes + ':' : '') + seconds + (showCentis ? '.' + centis : '');
}\n\n
EOD;
$tabLinks = $tabDivs = '';
foreach ( $whats as $what ) {
  list( $eventId, $eventName, $divide ) = explode( ':', "$what:100" );
  #pretty("$eventId, $eventName, $divide");
  $tabLinks .= "<li><a href=\"#container_$eventId\">$eventName</a></li>\n";
  $tabDivs  .= "<div id=\"container_$eventId\" style=\"xwidth: 95%; width: 940px; height: 600px; margin: auto; xborder: 1px solid red\"></div>\n";
  $eventChartsJs .= buildGraph( $eventName, $eventId, $divide ) . "\n";
}
file_put_contents( 'charts_data.js', "$eventChartsJs});});" );

#--- Finish/store/show the page
echo "\n<div id=\"tabs\" style=\"font-size:0.7em; width:980px; margin:auto\">\n<ul>\n$tabLinks</ul>\n$tabDivs</div>";
require( '../../includes/_footer.php' );
$html = ob_get_clean();
echo $html;
if ( ! wcaDebug() )
  file_put_contents( 'index.php', $html );

#----------------------------------------------------------------------
function buildGraph ( $eventName, $eventId, $divide ) {
#----------------------------------------------------------------------

  #pretty("buildGraph( $eventName, $eventId, $divide ) ...");

  $series = array();
  $highestCurrent = 0;
  $yMax = 0;

  #--- Build the series of this event
  foreach ( array( '1 best green', '1 average green', '10 best blue', '10 average blue', '100 best red', '100 average red' ) as $lineData ) {
    list( $n, $valueId, $color ) = explode( ' ', $lineData );

    #--- Get this event's results
    $rows = dbQueryHandle("
      SELECT personId, $valueId value, year + datediff(year*10000+month*100+day,year*10000+101)/365.25 date
      FROM Results result, Competitions competition
      WHERE competition.id = competitionId
        AND eventId = '$eventId' AND $valueId > 0
      ORDER BY year, month, day
    ");

    // Gather the data
    $xdata = array();         // x-coordinates for the line-points of the graph
    $ydata = array();         // y-coordinates for the line-points of the graph
    $data = array();          // coordinates for the line-points of the graph
    $records = array();       // $records[$personId] = record of that person
    $nthPlaceRecord = false;  // record of the n-th place person
    $direction = ($eventId == '333mbf') ? -1 : 1;
    while( $row = mysql_fetch_row( $rows ) ) {
      list( $personId, $value, $date ) = $row;
      if ( $eventId == '333mbf' ) $value = (($value - $value%10000000) / 10000000) - 99;
#      if ( $eventId == '333mbf' ) echo "$value ";

      //--- Skip values worse than n-th place
      if ( $nthPlaceRecord && $value >= $nthPlaceRecord )
        continue;

      //--- Update this person's record
      $oldRecord = isset($records[$personId]) ? $records[$personId] : 1000000000;
      if ( $value < $oldRecord )
        $records[$personId] = $value;

      //--- If we just reached n persons or this person just entered the top n...
      if ( !$nthPlaceRecord && count($records)==$n  ||  $oldRecord>=$nthPlaceRecord && $value<$nthPlaceRecord) {

#echo "$nthPlaceRecord $oldRecord $value<br />";
        //--- Sort the records, determine the n-th place value, and just keep the top n
        asort( $records );
        $keep = array();
        foreach ( $records as $personId => $rec ) {
          $nthPlaceRecord = $keep[$personId] = $rec;
          if ( count($keep) == $n )
            break;
        }
        $records = $keep;

        //--- Remove previous line points for the same date
        while ( end($xdata) == $date ) {
          array_pop( $xdata );
          array_pop( $ydata );
          array_pop( $data );
        }

        if ( $nthPlaceRecord * $direction == end($ydata) )
          continue;

        //--- Add the line point
        $xdata[] = $date;
        $ydata[] = $nthPlaceRecord * $direction;
        $data[] = array( round($date,2), $nthPlaceRecord * $direction );
        #printf( "<pre>%6.2f %6.2f</pre>", $date, $nthPlaceRecord );
        #echo "<pre>"; print_r( $records ); echo "</pre>";
      }
    }

    //--- Free the query handle
    mysql_free_result( $rows );

    //--- Skip if we didn't even find n persons
    if ( ! $nthPlaceRecord )
      continue;

    //--- Remember the worst current shown record for later y-scale adjustment (worst will be at 1/3 height)
    $highestCurrent = max( $highestCurrent, $nthPlaceRecord * $direction );
    #echo "<p>$eventName: $highestCurrent</p>";

    //--- Repeat the last height in the far future to finish with a straight line
    $xdata[] = 2222;
    $ydata[] = end($ydata);
    $data[] = array( 2222, end($ydata) );
    $yMax = max($yMax, max($ydata));

    $valueName = ($valueId == 'best') ? 'Single' : 'Average';
    $series[] = "{ name: '#$n $valueName', color:'$color', data: " . json_encode( $data ) . '}';
  }

  #--- Build and return the javascript for this event's graph
  $chartJs = file_get_contents( 'charts_template.js' );
  $chartJs = str_replace( '$eventId'  , $eventId, $chartJs );
  $chartJs = str_replace( '$xMax'     , 1970 + time()/60/60/24/365.25, $chartJs );
  $chartJs = str_replace( '$yMax'     , min($yMax, ($direction > 0 ? 3 : 1) * $highestCurrent), $chartJs );
  $chartJs = str_replace( '$divide'   , $divide, $chartJs );
  $chartJs = str_replace( '$eventName', json_encode(eventName($eventId)), $chartJs );
  $chartJs = str_replace( '$series'   , implode( ",\n    ", $series ), $chartJs );
  return $chartJs;
}

?>
