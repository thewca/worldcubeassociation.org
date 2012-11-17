<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'misc';
$extraHeaderStuff = '<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js" type="text/javascript"></script>'."\n"           # See http://jquery.com/download/
                  . '<link type="text/css" href="../evolution/jquery-ui-1.8.24.tabs/css/ui-lightness/jquery-ui-1.8.24.custom.css" rel="stylesheet" />'."\n" # See jquery-ui-1.8.24.custom/README.md
                  . '<script type="text/javascript" src="../evolution/jquery-ui-1.8.24.tabs/js/jquery-ui-1.8.24.custom.min.js"></script>'."\n"              # See jquery-ui-1.8.24.custom/README.md
                  . "<script type='text/javascript'> $(function(){ $('#tabs').tabs(); }); </script>\n";                                        # Starting jQuery

ob_start();
require( '../../includes/_header.php' );

/*
TODO: Offer a different order, emphasizing success number or rate?
personId	success	rounds	accuracy
2004GALL02	36	65	50.04%
2007HABE01	14	17	70.83%
2008AURO01	14	44	25.28%
2005KOCZ01	11	33	28.73%
2007HUGH01	10	30	25.11%
2004LOLE01	10	47	19.84%
2006BUUS01	7	33	35.86%
2004MAOT02	7	48	14.87%
2009LIAN03	7	21	24.62%
2004CHAN04	5	61	6.80%
*/

#--- Output the page header.
echo "<h1>Missing Averages</h1>\n\n";
echo "<p style='padding-left:20px;padding-right:20px;font-weight:bold'>Some events don't have official averages, only singles. They have best-of-3 rounds, though, so we can compute mean-of-3. This page does that. Since mean-of-3 is pretty hard for 4x4 and 5x5 blindfolded, means of 2 (out of 2 or 3) are shown instead for those who don't have a mean-of-3 yet. Note this is just for fun, officially we only rank by best-of-X single results. </p>";
echo "<p style='padding-left:20px;padding-right:20px;color:gray;font-size:10px'>Generated on " . wcaDate() . ".</p>";

#--- Tabbing div and links
$tabLinks = '';
foreach ( array( '333bf', '333fm', '444bf', '555bf' ) as $eventId )
  $tabLinks .= "<li><a href=\"#container_$eventId\">$eventId</a></li>\n";
echo "\n<div id=\"tabs\" style=\"font-size:1.0em; width:980px; margin:auto; background:white \">\n<ul>\n$tabLinks</ul>\n";

#--- Tabbing contents
foreach ( array( '333bf', '333fm', '444bf', '555bf' ) as $eventId ) {
  echo "<div id=\"container_$eventId\">";
  showBody( $eventId );
  echo "</div>\n";
}

#--- Finish/store/show the page
echo "</div>";
require( '../../includes/_footer.php' );
$html = ob_get_clean();
#$html = preg_replace( "/'p.php/", "'../p.php", $html );
echo $html;
if ( ! wcaDebug() )
  file_put_contents( 'index.php', $html );

#----------------------------------------------------------------------
function showBody ( $eventId ) {
#----------------------------------------------------------------------

  #--- Get the data
  $rows = dbQuery("
    SELECT    personId, personName, min(value1+value2+value3) minSum, count(*) means, 0 minSum2, 0 means2
    FROM      Results
    WHERE     eventId = '$eventId' and (value1>0)+(value2>0)+(value3>0) = 3
    GROUP BY  personId
    ORDER BY  minSum, personName
  ");
  $also2 = $eventId == '444bf' || $eventId == '555bf';
  if ( $also2 ) {
    $rows = array_merge( $rows, dbQuery("
      SELECT    personId, personName, 0 minSum, 0 means, min(greatest(0,value1)+greatest(0,value2)+greatest(0,value3)) minSum2, count(*) means2
      FROM      Results
      WHERE     eventId = '$eventId' and (value1>0)+(value2>0)+(value3>0) = 2
      GROUP BY  personId
      ORDER BY  minSum2, personName
    ") );
  }

  #--- Output the table header
  TableBegin( 'results', 7 );
  TableHeader( array('Pos', 'Name', 'Best Mean', 'Means', $also2?'Best 2-Mean':'', $also2?'2-Means':'', ''),
               array( 'class="r"', 'class="p"', 'class="r"', 'class="r"', 'class="r"', 'class="r"', 'class="f"' ) );

  #--- Output the table contents
  $listed = array();
  $pos = 0;
  foreach ( $rows as $row ) {
    list( $personId, $personName, $minSum, $means, $minSum2, $means2 ) = $row;
    if ( !isset($listed[$personId]) ) {
      $mean  = $eventId == '333fm' ? sprintf('%.2f',$minSum/3) : formatValue(round($minSum/3));
      $mean2 = $eventId == '333fm' ? '' : formatValue(round($minSum2/2));
      TableRow( array( ++$pos, personLink( $personId, $personName ), $mean, $means, $mean2, $means2, '' ) );
    }
    $listed[$personId] = true;
  }

  #--- Output the table end
  TableEnd();
}

?>
