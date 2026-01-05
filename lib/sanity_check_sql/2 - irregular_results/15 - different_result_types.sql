SELECT competition_id, event_id, round_type_id, COUNT(solves) as num_results
FROM (SELECT DISTINCT competition_id,
                      event_id,
                      round_type_id,
                      IF(value1 <> 0, 1, 0)
                        + IF(value2 <> 0, 1, 0) + IF(value3 <> 0, 1, 0) + IF(value4 <> 0, 1, 0) +
                      IF(value5 <> 0, 1, 0) as solves
      FROM results
      WHERE RIGHT(competition_id, 4) >= 2013) re
GROUP BY competition_id, event_id, round_type_id
HAVING IF(round_type_id in ('c', 'd', 'e', 'g', 'h'), num_results > 2, num_results > 1)
ORDER BY competition_id
