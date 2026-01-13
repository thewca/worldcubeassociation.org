WITH relevant_results AS (SELECT *
                          FROM results
                          WHERE RIGHT(competition_id, 4) >= 2013),

     num_attempts_per_result AS (SELECT person_id, event_id, competition_id, round_type_id, COUNT(*) AS num_attempts
                                 FROM relevant_results AS r
                                        JOIN result_attempts ra ON ra.result_id = r.id
                                 GROUP BY result_id)

SELECT competition_id,
       event_id,
       round_type_id,
       COUNT(DISTINCT num_attempts) AS different_result_types
FROM num_attempts_per_result
GROUP BY competition_id, event_id, round_type_id
HAVING different_result_types > IF(round_type_id IN ('c', 'd', 'e', 'g', 'h'), 2, 1);
