<?php

#--- Compute $results = ( value, personId, personName, countryName, competitionId, competitioName, [value1-5] ).

if( $chosenAverage ){
  $results = dbQuery("
    SELECT
                           result.*,
      result.$valueSource  value,
      competition.cellName competitionName,
      country.name         countryName
    FROM
      Results result,
      Competitions competition,
      Countries country
    WHERE " . randomDebug() . "
      AND average>0 $eventCondition $yearCondition $regionCondition
      AND competition.id = competitionId
      AND country.id     = result.countryId
    ORDER BY
      value, best, personName, competitionId, roundTypeId
    $limitCondition
  ");
}

#--- Compute $results = ( value, personId, personName, countryName, competitionId, competitioName, [value1-5] ).

else {
  for ( $i=1; $i<=5; $i++ )
    $subqueryParts[] = "SELECT   value$i value, personId, personName, country.name countryName, competitionId, competition.cellName competitionName, roundTypeId
                        FROM     Results result,
                                 Competitions competition,
                                 Countries country
                        WHERE    " . randomDebug() . "
                          AND    value$i>0 $eventCondition $yearCondition $regionCondition
                          AND    competition.id = competitionId
                          AND    country.id     = result.countryId
                        ORDER BY value, personName
                        $limitCondition";
  $subquery = '(' . implode( ') UNION ALL (', $subqueryParts ) . ')';
  $results = dbQuery("
    SELECT   *
    FROM    ($subquery) result
    ORDER BY value, personName, competitionId, roundTypeId
    $limitCondition
  ");
}

?>
