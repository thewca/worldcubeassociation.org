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
         AND (result.best < record.single  OR  personId = '$chosenPersonId')
         AND event.id = record.eventId
       GROUP BY
         eventId
       ORDER BY
         event.rank) singles

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
         AND (result.average < record.average  OR  personId = '$chosenPersonId')
         AND event.id = record.eventId
       GROUP BY
         averageEventId
       ORDER BY
         event.rank) averages

    ON eventId = averageEventId
  ");

  tableBegin( 'results', 6 );
  tableCaption( false, "Current Personal Records" );
  tableHeader( split( " ", "Event Rank Single Average Rank " ),
               array( 1 => "class='r'", 2 => "class='R2'", 3 => "class='R2'", 4 => "class='r'", 5 => "class='f'" ));

  foreach( $bests as $best ){
    extract( $best );
    tableRow( array(
      internalEventLink( "#$eventId", $eventCellName ),
      $singleRank,
      eventLink( $eventId, formatValue( $single, $valueFormat )),
      eventAverageLink( $eventId, formatValue( $average, $valueFormat )),
      $averageRank,
      ''
    ));
  }

  tableEnd();
}

?>
