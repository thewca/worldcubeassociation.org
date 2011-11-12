<?php

showRegionalRecordsSeparate();

#----------------------------------------------------------------------
function showRegionalRecordsSeparate () {
#----------------------------------------------------------------------
  global $chosenRegionId;

  require( 'regions_get_current_records.php' );

  tableBegin( 'results', 6 );

  tableCaption( false, "Single" );
  tableHeader( explode( '|', 'Event|Result|Person|Citizen of|Competition|' ),
               array( 1 => "class='R2'", 5 => 'class="f"' ));

  foreach( $results as $result ){
    extract( $result );

    if( $type == 'Single' ){
      $isNewEvent = ($eventId != $currentEventId); $currentEventId = $eventId;
      tableRow( array(
        $isNewEvent ? eventLink( $eventId, $eventCellName ) : '',
        $isNewEvent ? formatValue( $value, $format ) : '',
        personLink( $personId, $personName ),
        $countryName,
        competitionLink( $competitionId, $competitionName ),
        ''
      ));
    }
  }

  tableCaption( false, "Average" );
  tableHeader( explode( '|', 'Event|Result|Person|Citizen of|Competition|Result Details' ),
               array( 1 => "class='R2'", 5 => 'class="f"' ));

  $currentEventId = '';
  foreach( $results as $result ){
    extract( $result );

    if( $type == 'Average' ){
      $isNewEvent = ($eventId != $currentEventId); $currentEventId = $eventId;
      tableRow( array(
        $isNewEvent ? eventLink( $eventId, $eventCellName ) : '',
        $isNewEvent ? formatValue( $value, $format ) : '',
        personLink( $personId, $personName ),
        $countryName,
        competitionLink( $competitionId, $competitionName ),
        formatAverageSources( true, $result, $format )
      ));
    }
  }

  tableEnd();
}

?>
