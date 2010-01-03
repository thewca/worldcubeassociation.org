<?php

showRegionalRecordsHistory();

#----------------------------------------------------------------------
function showRegionalRecordsHistory () {
#----------------------------------------------------------------------
  global $chosenRegionId;

  #--- Compute the region condition and the normal record name.
  if( preg_match( '/^(world)?$/i', $chosenRegionId )){
    $regionCondition = "AND recordName = 'WR'";
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
      event.id         eventId,
      event.name       eventName,

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
      (SELECT Results.*, 1 type, best    value, regionalSingleRecord  recordName FROM Results UNION
       SELECT Results.*, 2 type, average value, regionalAverageRecord recordName FROM Results) result,
      Events event,
      Competitions competition,
      Countries country
    WHERE " . randomDebug() . "
      AND event.id = eventId
      AND event.rank < 999
      AND competition.id = competitionId
      AND country.id = result.countryId
      $regionCondition
      " . eventCondition() . yearCondition() . "
    ORDER BY
      event.rank, type, value, year desc, month desc, day desc, roundId DESC  # TOD?: how to do it right?
#      event.rank, type, year desc, month desc, day desc, value  # TOD?: how to do it right?
  ");

  #--- Process the results.
  tableBegin( 'results', 7 );
  foreach( $results as $results ){
    extract( $results );

    #--- Announce the event.
    if( $eventId != $currentEventId ){
      $currentEventId = $eventId;
      tableCaptionNew( false, $eventId, eventLink( $eventId, $eventName ));
      tableHeader( split( '\\|', '|Single|Average|Person|Citizen of|Competition|Result Details' ),
                   array( 1 => 'class="R2"', 2 => 'class="R2"', 6 => 'class="f"' ));
    }

    #--- Determine how to display the record name.
    if( $recordName != $normalRecordName )
      $recordName = "<span style='color:#f93;font-weight:bold'>$recordName</span>";

    #--- Show the table row.
    tableRow( array(
      $recordName,
      (($type == 1) ? formatValue( $value, $valueFormat ) : ''),
      (($type == 2) ? formatValue( $value, $valueFormat ) : ''),
      personLink( $personId, $personName ),
      $countryName,
      competitionLink( $competitionId, $competitionName ),
      formatAverageSources( $type == 2, $results, $valueFormat )
    ));
  }

  tableEnd();
}

?>
