<?php

# TODO: order by Rounds.rank instead of roundId?
# TODO idea: If single and average in same round by same person, show them on same row?
# TODO idea: show round? Maybe as number like "Competition (round)"?

showRegionalRecordsHistory();

#----------------------------------------------------------------------
function showRegionalRecordsHistory () {
#----------------------------------------------------------------------
  global $chosenRegionId, $chosenHistory, $chosenMixHist;

  #--- Compute the region condition and the normal record name.
  if( preg_match( '/^(world)?$/i', $chosenRegionId )){
    $regionCondition = "AND recordName = 'WR'";
    $normalRecordName = '';
  } elseif( preg_match( '/^_/', $chosenRegionId )){
    $tmp = dbQuery( "SELECT recordName FROM Continents WHERE id = '$chosenRegionId'" );
    $normalRecordName = $tmp[0][0];
    $regionCondition = "AND recordName in ('WR', '$normalRecordName' ) AND continentId = '$chosenRegionId'";
  } else {
    $regionCondition = "AND (recordName <> '') AND (result.countryId = '$chosenRegionId')";
    $normalRecordName = 'NR';
  }

  #--- Order: normal history or mixed?
  $order = $chosenHistory
           ? 'event.rank, type, value, year desc, month desc, day desc, roundId desc'
           : 'year desc, month desc, day desc, roundId desc, event.rank, type, value';

  #--- Get the results.
  $results = dbQuery("
    SELECT
      year, month, day,

      event.id         eventId,
      event.name       eventName,
      event.cellName   eventCellName,

      result.type      type,
      result.value     value,
      event.format     valueFormat,
                       recordName,

      result.personId   personId,
      result.personName personName,

      country.name     countryName,

      competition.id   competitionId,
      competition.cellName competitionName,

      value1, value2, value3, value4, value5
    FROM
      (SELECT Results.*, 1 type, best    value, regionalSingleRecord  recordName FROM Results WHERE regionalSingleRecord<>'' UNION
       SELECT Results.*, 2 type, average value, regionalAverageRecord recordName FROM Results WHERE regionalAverageRecord<>'') result,
      Events event,
      Competitions competition,
      Countries country
    WHERE " . randomDebug() . "
      AND event.id = eventId
      AND event.rank < 1000
      AND competition.id = competitionId
      AND country.id = result.countryId
      $regionCondition
      " . eventCondition() . yearCondition() . "
    ORDER BY
      $order
  ");

  #--- Start the table
  if( $chosenHistory ){
    tableBegin( 'results', 7 );
  } else {
    tableBegin( 'results', 9 );
    tableHeader( explode( '|', 'Date|Event|What|Single|Average|Person|Citizen of|Competition|Result Details' ),
                 array( 3 => 'class="R2"', 4 => 'class="R2"', 8 => 'class="f"' ));
  }

  #--- Process the results.
  $currentEventId = false;
  foreach( $results as $result ){
    extract( $result );

    #--- Announce the event (only for normal history, not mixed)
    if( $chosenHistory  &&  $eventId != $currentEventId ){
      $currentEventId = $eventId;
      tableCaptionNew( false, $eventId, eventLink( $eventId, $eventName ));
      tableHeader( explode( '|', '|Single|Average|Person|Citizen of|Competition|Result Details' ),
                   array( 1 => 'class="R2"', 2 => 'class="R2"', 6 => 'class="f"' ));
    }

    #--- Determine how to display the record name.
    if( $recordName != $normalRecordName )
      $recordName = "<span style='color:#f93;font-weight:bold'>$recordName</span>";

    #--- Prepare the table row.
    $data = array(
      $recordName,
      (($type == 1) ? formatValue( $value, $valueFormat ) : ''),
      (($type == 2) ? formatValue( $value, $valueFormat ) : ''),
      personLink( $personId, $personName ),
      $countryName,
      competitionLink( $competitionId, $competitionName ),
      formatAverageSources( $type == 2, $result, $valueFormat )
    );
    if( $chosenMixHist )
      array_unshift( $data,
                     sprintf( '%4d-%02d-%02d', $year, $month, $day ),
                     eventLink( $eventId, $eventCellName ) );

    #--- Show the table row.
    tableRow( $data );
  }

  tableEnd();
}

?>
