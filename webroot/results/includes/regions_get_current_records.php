<?php

$results = dbQuery("
  SELECT *
  FROM
    (" . regionsGetCurrentRecordsQuery( 'best', 'Single' ) . "
    UNION
    " . regionsGetCurrentRecordsQuery( 'average', 'Average' ) . ") helper
  ORDER BY
    rank, type DESC, year, month, day, roundTypeId, personName
");

function regionsGetCurrentRecordsQuery ( $valueId, $valueName ) {
  return
   "SELECT
      '$valueName'     type,
                       result.*,
                       value,
      event.name       eventName,
      event.cellName   eventCellName,
                       format,
      country.name     countryName,
      competition.cellName competitionName,
                       rank, year, month, day
    FROM
      (SELECT eventId recordEventId, MIN(value)
       FROM Concise{$valueName}Results
       WHERE 1 " . regionCondition('') . eventCondition() . yearCondition() . "
       GROUP BY eventId) record,
      Results result,
      Events event,
      Countries country,
      Competitions competition
    WHERE " . randomDebug() . "

      AND result.$valueId = value
      " . regionCondition('result') . eventCondition() . yearCondition() . "

      AND result.eventId = recordEventId
      AND event.id       = result.eventId
      AND country.id     = result.countryId
      AND competition.id = result.competitionId
      AND event.rank < 990";
}

?>
