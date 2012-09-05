<?

showHistoryOfWorldRecords ();

#----------------------------------------------------------------------
function showHistoryOfWorldRecords () {
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
      AND (result.regionalSingleRecord='WR' OR result.regionalAverageRecord='WR')
      AND event.id = result.eventId
      AND competition.id = result.competitionId
      AND round.id = result.roundId
      AND event.rank < 999
    ORDER BY
      event.rank, year DESC, month DESC, day DESC, roundId DESC
  ");

  if( ! count( $results ))
    return;

  tableBegin( 'results', 6 );
  tableCaption( false, 'History of World Records' );
  tableHeader( explode( '|', 'Event|Single|Average|Competition|Round|Result Details' ),
               array( 1 => "class='R2'", 2 => "class='R2'", 5 => "class='f'" ));

  foreach( $results as $result ){
    extract( $result );
    if( isset( $currentEventId ) &&  $eventId != $currentEventId )
      tableRowEmpty();
    tableRow( array(
      (isset($currentEventId) && $eventId == $currentEventId) ? '' : eventLink( $eventId, $eventCellName ),
      ($regionalSingleRecord == 'WR') ? formatValue( $best, $valueFormat ) : '',
      ($regionalAverageRecord == 'WR') ? formatValue( $average, $valueFormat ) : '',
      competitionLink( $competitionId, $competitionCellName ),
      $roundCellName,
      formatAverageSources( $regionalAverageRecord == 'WR', $result, $valueFormat )
    ));
    $currentEventId = $eventId;
  }

  tableEnd();
}

?>
