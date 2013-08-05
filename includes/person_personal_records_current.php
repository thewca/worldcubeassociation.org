<?

showCurrentPersonalRecords();

#----------------------------------------------------------------------
function showCurrentPersonalRecords () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  $bests = dbQuery("

  SELECT * FROM

   (SELECT 
      eventId,
      best single,
      worldRank singleRank,
      continentRank singleRankContinent,
      countryRank singleRankCountry
    FROM RanksSingle
    WHERE personId='$chosenPersonId') singles
    
    LEFT JOIN
   
   (SELECT 
      eventId eC,
      best average,
      worldRank averageRank,
      continentRank averageRankContinent,
      countryRank averageRankCountry
    FROM RanksAverage
    WHERE personId='$chosenPersonId') average
    
    ON eventId = eC,
    Events event
    WHERE
      eventId = event.id
    ORDER BY
      event.rank


  ");

  tableBegin( 'results', 10 );
  tableCaption( false, "Current Personal Records" );
  tableHeader( explode( " ", "Event NR CR WR Single Average WR CR NR " ),
               array( "", "class='r'", "class='r'", "class='R'", "class='R2'", "class='R2'", "class='R'", "class='r'", "class='r'", "class='f'" ));

  $oddMessage = "A missing or worse country/continent rank compared to a larger region rank is due to the change of country because results from previous regions don&#39;t count for differing current regions.";
  foreach( $bests as $best ){
    extract( $best );
    $odd = $singleRankCountry > $singleRankContinent || $singleRankContinent > $singleRank || $averageRankCountry > $averageRankContinent || $averageRankContinent > $averageRank
        || !$singleRankCountry && $singleRankContinent || !$singleRankContinent && $singleRank || !$averageRankCountry && $averageRankContinent || !$averageRankContinent && $averageRank;
    tableRow( array(
      internalEventLink( "#$eventId", eventCellName( $eventId )),
      "<span style='color:#999'>" . colorMe( $singleRankCountry ) . "</span>",
      colorMe( $singleRankContinent ),
      colorMe( $singleRank ),
      eventLink( $eventId, formatValue( $single, valueFormat( $eventId ) )),
      eventAverageLink( $eventId, formatValue( $average, valueFormat( $eventId ))),
      colorMe( $averageRank ),
      colorMe( $averageRankContinent ),
      "<span style='color:#999'>" . colorMe( $averageRankCountry ) . "</span>",
      $odd ? "<a title='$oddMessage' style='color:#66F' onclick='alert(\"$oddMessage\")'>(*)</a>" : ''
    ));
  }

  tableEnd();
}

#----------------------------------------------------------------------
function colorMe ( $rank ) {
#----------------------------------------------------------------------

  if ( $rank == '0' ) return '-';
  if ( $rank ==  1  ) return "<span style='color:#F60;font-weight:bold'>$rank</span>";
  return $rank;
}

?>
