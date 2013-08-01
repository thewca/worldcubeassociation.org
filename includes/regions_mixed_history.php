<?php

showRegionalRecordsHistory();

#----------------------------------------------------------------------
function showRegionalRecordsHistory () {
#----------------------------------------------------------------------
  global $chosenRegionId;

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

  #--- Get the results.
  $results = dbQuery("
    SELECT
      year, month, day,

      event.id         eventId,
      event.cellName   eventName,

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
      AND event.rank < 990
      AND competition.id = competitionId
      AND country.id = result.countryId
      $regionCondition
      " . eventCondition() . yearCondition() . "
    ORDER BY
      year desc, month desc, day desc, roundId DESC, event.rank, type, value   # TODO: If single and average in same round, show them on same row? At least if by same person?
  ");

  #--- Process the results.
  tableBegin( 'results', 9 );
  tableHeader( explode( '|', 'Date|Event|What|Single|Average|Person|Citizen of|Competition|Result Details' ),  # TODO: show round? Maybe as number like "Competition (round)"?
               array( 3 => 'class="R2"', 4 => 'class="R2"', 8 => 'class="f"' ));
  foreach( $results as $result ){
    extract( $result );

    #--- Determine how to display the record name.
    if( $recordName != $normalRecordName )
      $recordName = "<span style='color:#f93;font-weight:bold'>$recordName</span>";

    #--- Show the table row.
    tableRow( array(
      sprintf( '%4d-%02d-%02d', $year, $month, $day ),
      eventLink( $eventId, $eventName ),
      $recordName,
      (($type == 1) ? formatValue( $value, $valueFormat ) : ''),
      (($type == 2) ? formatValue( $value, $valueFormat ) : ''),
      personLink( $personId, $personName ),
      $countryName,
      competitionLink( $competitionId, $competitionName ),
      formatAverageSources( $type == 2, $result, $valueFormat )
    ));
  }

  tableEnd();
}

?>
