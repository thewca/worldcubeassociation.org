SELECT competitionId, eventId, roundTypeId, COUNT(solves) as num_results
FROM (SELECT DISTINCT competitionId,
                      eventId,
                      roundTypeId,
                      IF(value1 <> 0, 1, 0)
                        + IF(value2 <> 0, 1, 0) + IF(value3 <> 0, 1, 0) + IF(value4 <> 0, 1, 0) +
                      IF(value5 <> 0, 1, 0) as solves
      FROM Results
      WHERE RIGHT(competitionId, 4) >= 2013) re
GROUP BY competitionId, eventId, roundTypeId
HAVING IF(roundTypeId in ('c', 'd', 'e', 'g', 'h'), num_results > 2, num_results > 1)
ORDER BY competitionId
