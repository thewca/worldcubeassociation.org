<?php

#--- Get the results.
$results = dbQuery("
  SELECT
                         result.*,
    result.$valueSource  value,
    competition.cellName competitionName,
    country.name         countryName
  FROM
    (SELECT MIN(value * 1000000000 + resultId) valueAndId
     FROM Concise${valueName}Results result
     WHERE $valueSource>0 $eventCondition $yearCondition $regionCondition
     GROUP BY personId
     ORDER BY valueAndId
     $limitCondition) top,
    Results result,
    Competitions competition,
    Countries country
  WHERE " . randomDebug() . "
    AND result.id      = valueAndId % 1000000000
    AND competition.id = competitionId
    AND country.id     = result.countryId
  ORDER BY
    value, personName
");

?>
