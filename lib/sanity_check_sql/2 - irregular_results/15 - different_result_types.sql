SELECT competition_id, event_id, round_type_id, COUNT(DISTINCT num_results) AS different_result_types
FROM (SELECT person_id, event_id, competition_id, round_type_id, COUNT(*) AS num_results
      FROM results as r
             JOIN result_attempts ra ON ra.result_id = r.id
      WHERE RIGHT(competition_id, 4) >= 2013
      GROUP BY result_id) t1
GROUP BY competition_id, event_id, round_type_id
HAVING different_result_types > CASE WHEN round_type_id IN ('c', 'd', 'e', 'g', 'h') THEN 2 ELSE 1 END
