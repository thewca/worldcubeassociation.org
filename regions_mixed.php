<?php

showRegionalRecordsMixed();

#----------------------------------------------------------------------
function showRegionalRecordsMixed () {
#----------------------------------------------------------------------
  global $chosenRegionId;

  require( 'regions_get_current_records.php' );

  tableBegin( 'results', 6 );
  tableCaption( false, spaced( array( chosenRegionName(), $chosenYears )));
  tableHeader( explode( '|', 'Type|Result|Person|Citizen of|Competition|Result Details' ),
               array( 1 => "class='R2'", 5 => 'class="f"' ));

  foreach( $results as $result ){
    extract( $result );

    $isNewEvent = ($eventId != $currentEventId); $currentEventId = $eventId;
    $isNewType = $isNewEvent || ($type != $currentType); $currentType = $type;

    if( $isNewEvent )
      tableCaption( false, eventLink( $eventId, $eventName ));
    tableRow( array(
      $isNewType ? $type : '',
      $isNewType ? formatValue( $value, $format ) : '',
      personLink( $personId, $personName ),
      $countryName,
      competitionLink( $competitionId, $competitionName ),
      formatAverageSources( $type == 'Average', $result, $format )
    ));
  }

  tableEnd();
}

?>
