<?php

$results = dbQuery("
  SELECT *
  FROM
    (" . regionsGetCurrentRecordsQuery( 'best', 'Single' ) . "
    UNION
    " . regionsGetCurrentRecordsQuery( 'average', 'Average' ) . ") helper
  ORDER BY
    helper.rank, helper.type DESC, helper.year, helper.month, helper.day, helper.roundTypeId, helper.personName
");

function regionsGetCurrentRecordsQuery ( $valueId, $valueName ) {
  return
   "SELECT
      '$valueName'     type,
                       result.*,
                       record.value,
      event.name       eventName,
      event.cellName   eventCellName,
                       event.format,
      country.name     countryName,
      competition.cellName competitionName,
                       event.rank,
                       competition.year,
                       competition.month,
                       competition.day
    FROM
      (SELECT eventId recordEventId, MIN(valueAndId) DIV 1000000000 value
       FROM Concise{$valueName}Results
       WHERE 1 " . regionCondition('') . eventCondition() . yearCondition() . "
       GROUP BY eventId) record,
      Results result,
      Events event,
      Countries country,
      Competitions competition
    WHERE " . randomDebug() . "

      AND result.$valueId = record.value
      " . regionCondition('result') . eventCondition() . yearCondition() . "

      AND result.eventId = record.recordEventId
      AND event.id       = result.eventId
      AND country.id     = result.countryId
      AND competition.id = result.competitionId
      AND event.rank < 990";
}

?>
