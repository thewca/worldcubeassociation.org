<?php

showWorldChampionshipPodiums ();

#----------------------------------------------------------------------
function showWorldChampionshipPodiums () {
#----------------------------------------------------------------------
  global $chosenPersonId;

  $results = dbQuery("
    SELECT
      result.*,
      event.format         valueFormat,
      event.cellName       eventCellName,
      competition.cellName competitionCellName,
      year
    FROM
      Results      result,
      Competitions competition,
      Events       event
    WHERE " . randomDebug() . "
      AND best > 0
      AND pos <= 3
      AND roundId in ('f', 'c')
      AND competition.cellName like 'World Championship %'
      AND result.personId = '$chosenPersonId'
      AND event.id = result.eventId
      AND competition.id = result.competitionId
      AND event.rank < 1000
    ORDER BY
      year DESC, event.rank
  ");

  if( ! count( $results ))
    return;

  tableBegin( 'results', 6 );
  tableCaption( false, 'World Championship Podiums' );
  tableHeader( explode( '|', 'Year|Event|Place|Single|Average|Result Details' ),
               array( 0 => "class='R2'", 2 => "class='R2'", 3 => "class='r'", 4 => "class='r'", 5 => "class='f'" ));

  $lastYear = 0;
  foreach( $results as $result ){
    extract( $result );
    if( $year < $lastYear )
      tableRowEmpty();
    tableRow( array(
      ($year != $lastYear) ? $year : '',
      eventLink( $eventId, $eventCellName ),
      competitionLink( $competitionId, $pos, $eventId, $roundId ),
      formatValue( $best, $valueFormat ),
      formatValue( $average, $valueFormat ),
      formatAverageSources( true, $result, $valueFormat )
    ));
    $lastYear = $year;
  }

  tableEnd();
}

?>
