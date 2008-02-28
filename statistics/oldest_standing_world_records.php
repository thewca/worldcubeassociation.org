<?

$rows = dbQuery("
  SELECT
    event.id eventId,
    type,
    datediff( curdate(), year*10000+month*100+day ) days,
    value,
    concat( personId, '-', personName ),
    competitionId
  FROM
    (SELECT eventId, min(best) value, 'Single' type
     FROM ConciseSingleResults
     GROUP BY eventId
       UNION
     SELECT eventId, min(average) value, 'Average' type
     FROM ConciseAverageResults
     GROUP BY eventId) record,
    Results result,
    Competitions competition,
    Events event
  $WHERE 1
  
    AND ((type = 'Single' AND result.best = record.value) OR (type = 'Average' AND result.average = record.value))
    AND result.eventId = record.eventId
  
    AND competition.id = result.competitionId
    AND event.id       = result.eventId
  ORDER BY
    year, month, day, type DESC, event.rank
  LIMIT 10
");

$lists[] = array (
  "Oldest standing world records",
  "",
  "[E] Event [t] Type [N] Days [R] Result [P] Person [C] Competition",
  $rows
);

?>
