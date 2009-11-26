<?php

$results = dbQuery("
  SELECT
                     type,
                     result.*,
                     value,
    event.name       eventName,
    event.cellName   eventCellName,
                     format,
    country.name     countryName,
    competition.cellName competitionName
  FROM
    (SELECT eventId recordEventId, MIN(valueAndId) DIV 1000000000 value, 'Single' type
     FROM ConciseSingleResults
     WHERE 1 " . regionCondition('') . eventCondition() . yearCondition() . "
     GROUP BY eventId
       UNION
     SELECT eventId recordEventId, MIN(valueAndId) DIV 1000000000 value, 'Average' type
     FROM ConciseAverageResults
     WHERE 1 " . regionCondition('') . eventCondition() . yearCondition() . "
     GROUP BY eventId) record,
    Results result,
    Events event,
    Countries country,
    Competitions competition
  WHERE " . randomDebug() . "

    AND ((type = 'Single'  AND  result.best = value)  OR  (type = 'Average'  AND  result.average = value))
    " . regionCondition('result') . eventCondition() . yearCondition() . "

    AND result.eventId = recordEventId
    AND event.id       = result.eventId
    AND country.id     = result.countryId
    AND competition.id = result.competitionId
  ORDER BY
    rank, type DESC, year, month, day, roundId, personName
");

?>
