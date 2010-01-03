<?

showHistoryOfContinentalRecords ();

#----------------------------------------------------------------------
function showHistoryOfContinentalRecords () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  $results = dbQuery("
    SELECT
      result.*,
      event.format         valueFormat,
      event.cellName       eventCellName,
      competition.cellName competitionCellName,
      round.cellName       roundCellName
    FROM
      Results      result,
      Competitions competition,
      Events       event,
      Rounds       round
    WHERE " . randomDebug() . "
      AND result.personId = '$chosenPersonId'
      AND ((result.regionalSingleRecord != '' AND result.regionalSingleRecord != 'NR' AND result.regionalSingleRecord != 'WR') OR (result.regionalAverageRecord != '' AND result.regionalAverageRecord != 'NR' AND result.regionalAverageRecord != 'WR'))
      AND event.id = result.eventId
      AND event.rank < 999
      AND competition.id = result.competitionId
      AND round.id = result.roundId
    ORDER BY
      event.rank, year DESC, month DESC, day DESC, roundId DESC
  ");

  if( ! count( $results ))
    return;

  tableBegin( 'results', 6 );
  tableCaption( false, 'History of Continental Records' );
  tableHeader( split( '\\|', 'Event|Single|Average|Competition|Round|Result Details' ),
               array( 1 => "class='R2'", 2 => "class='R2'", 5 => "class='f'" ));

  foreach( $results as $result ){
    extract( $result );
    if( $currentEventId  &&  $eventId != $currentEventId )
      tableRowEmpty();
    tableRow( array(
      ($eventId == $currentEventId) ? '' : eventLink( $eventId, $eventCellName ),
      ($regionalSingleRecord == '' OR $regionalSingleRecord == 'NR' OR $regionalSingleRecord == 'WR') ? '' : formatValue( $best, $valueFormat ),
      ($regionalAverageRecord == '' OR $regionalAverageRecord == 'NR' OR $regionalAverageRecord == 'WR') ? '' : formatValue( $average, $valueFormat ),
      competitionLink( $competitionId, $competitionCellName ),
      $roundCellName,
      formatAverageSources( ($regionalAverageRecord != '' AND $regionalAverageRecord != 'NR' AND $regionalAverageRecord != 'WR'), $result, $valueFormat )
    ));
    $currentEventId = $eventId;
  }

  tableEnd();
}

?>
