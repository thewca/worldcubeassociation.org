<?

showCurrentPersonalRecords();

#----------------------------------------------------------------------
function showCurrentPersonalRecords () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  $bests = dbQuery("
    SELECT * FROM

      (SELECT
         record.eventId           eventId,
         event.cellName           eventCellName,
         record.single            single,
         count(distinct personId) singleRank,
         event.format             valueFormat
       FROM
         (SELECT eventId, min(valueAndId)/1000000000 single
            FROM ConciseSingleResults
            WHERE personId = '$chosenPersonId'
            GROUP BY eventId) record,
         ConciseSingleResults result,
         Events event
       WHERE 1
         AND result.eventId = record.eventId
         AND (result.best < record.single OR personId = '$chosenPersonId')
         AND event.id = record.eventId
       GROUP BY
         eventId
       ORDER BY
         event.rank) singles

    LEFT JOIN

      (SELECT
         record.eventId           eventIdContinent,
         count(distinct personId) singleRankContinent
       FROM
         (SELECT eventId, continentId, min(valueAndId)/1000000000 single
            FROM ConciseSingleResults
            WHERE personId = '$chosenPersonId'
            GROUP BY eventId) record,
         ConciseSingleResults result,
         Events event
       WHERE 1
         AND result.eventId = record.eventId
         AND (result.best < record.single OR personId = '$chosenPersonId')
         AND event.id = record.eventId
         AND result.continentId = record.continentId
       GROUP BY
         eventIdContinent
       ORDER BY
         event.rank) singlesContinent

    ON eventIdContinent = eventId
    LEFT JOIN

      (SELECT
         record.eventId           eventIdCountry,
         count(distinct personId) singleRankCountry
       FROM
         (SELECT eventId, countryId, min(valueAndId)/1000000000 single
            FROM ConciseSingleResults
            WHERE personId = '$chosenPersonId'
            GROUP BY eventId) record,
         ConciseSingleResults result,
         Events event
       WHERE 1
         AND result.eventId = record.eventId
         AND (result.best < record.single OR personId = '$chosenPersonId')
         AND event.id = record.eventId
         AND result.countryId = record.countryId
       GROUP BY
         eventIdCountry
       ORDER BY
         event.rank) singlesCountry

    ON eventIdCountry = eventId
    LEFT JOIN

      (SELECT
         record.eventId           averageEventId,
         record.average           average,
         count(distinct personId) averageRank
       FROM
         (SELECT eventId, min(valueAndId)/1000000000 average
            FROM ConciseAverageResults
            WHERE personId = '$chosenPersonId'
            GROUP BY eventId) record,
         ConciseAverageResults result,
         Events event
       WHERE ".randomDebug()."
         AND result.eventId = record.eventId
         AND (result.average < record.average OR personId = '$chosenPersonId')
         AND event.id = record.eventId
       GROUP BY
         averageEventId
       ORDER BY
         event.rank) averages

    ON eventId = averageEventId
    LEFT JOIN

      (SELECT
         record.eventId           averageEventIdContinent,
         count(distinct personId) averageRankContinent
       FROM
         (SELECT eventId, continentId, min(valueAndId)/1000000000 average
            FROM ConciseAverageResults
            WHERE personId = '$chosenPersonId'
            GROUP BY eventId) record,
         ConciseAverageResults result,
         Events event
       WHERE ".randomDebug()."
         AND result.eventId = record.eventId
         AND (result.average < record.average OR personId = '$chosenPersonId')
         AND event.id = record.eventId
         AND result.continentId = record.continentId
       GROUP BY
         averageEventIdContinent
       ORDER BY
         event.rank) averagesContinent

    ON averageEventId = averageEventIdContinent
    LEFT JOIN

      (SELECT
         record.eventId           averageEventIdCountry,
         count(distinct personId) averageRankCountry
       FROM
         (SELECT eventId, countryId, min(valueAndId)/1000000000 average
            FROM ConciseAverageResults
            WHERE personId = '$chosenPersonId'
            GROUP BY eventId) record,
         ConciseAverageResults result,
         Events event
       WHERE ".randomDebug()."
         AND result.eventId = record.eventId
         AND (result.average < record.average OR personId = '$chosenPersonId')
         AND event.id = record.eventId
         AND result.countryId = record.countryId
       GROUP BY
         averageEventIdCountry
       ORDER BY
         event.rank) averagesCountry

    ON averageEventIdCountry = averageEventIdContinent
  ");

  tableBegin( 'results', 10 );
  tableCaption( false, "Current Personal Records" );
  tableHeader( split( " ", "Event  Ranks  Single Average  Ranks  " ),
               array( "", "class='r'", "class='c'", "class='L'", "class='R2'", "class='R2'", "class='R'", "class='c'", "class='l'", "class='f'" ));

  foreach( $bests as $best ){
    extract( $best );
    tableRow( array(
      internalEventLink( "#$eventId", $eventCellName ),
      "<span style='color:#999'>$singleRankCountry</span>",
      $singleRankContinent,
      $singleRank,
      eventLink( $eventId, formatValue( $single, $valueFormat )),
      eventAverageLink( $eventId, formatValue( $average, $valueFormat )),
      $averageRank,
      $averageRankContinent,
      "<span style='color:#999'>$averageRankCountry</span>",
      ''
    ));
  }

  tableEnd();
}

?>
