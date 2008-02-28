<?

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
      value, best, personName
    $limitCondition
  ");
}

#--- Compute $results = ( value, personId, personName, countryName, competitionId, competitioName, [value1-5] ).

else {
  $results = dbQuery("
    SELECT
                           result.*,
                           value,
      competition.cellName competitionName,
      country.name         countryName
    FROM
      (SELECT personId, personName, competitionId, countryId, eventId, value1 value FROM Results UNION ALL
       SELECT personId, personName, competitionId, countryId, eventId, value2 value FROM Results UNION ALL
       SELECT personId, personName, competitionId, countryId, eventId, value3 value FROM Results UNION ALL
       SELECT personId, personName, competitionId, countryId, eventId, value4 value FROM Results UNION ALL
       SELECT personId, personName, competitionId, countryId, eventId, value5 value FROM Results
      ) result,
      Competitions competition,
      Countries country
    WHERE " . randomDebug() . "
      AND value>0 $eventCondition $yearCondition $regionCondition
      AND competition.id = competitionId
      AND country.id     = result.countryId
    ORDER
      BY value, personName
    $limitCondition
  ");
}

?>
