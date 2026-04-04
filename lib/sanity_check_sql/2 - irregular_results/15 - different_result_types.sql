WITH relevant_results AS (
  SELECT
    id,
    competition_id,
    event_id,
    round_type_id
  FROM results
  WHERE RIGHT(competition_id, 4) >= '2013'
),
attempt_counts AS (
  SELECT
    ra.result_id,
    COUNT(*) AS num_attempts
  FROM result_attempts AS ra
  INNER JOIN relevant_results AS rr
  ON ra.result_id = rr.id
  GROUP BY ra.result_id
)
SELECT
  r.competition_id,
  r.event_id,
  r.round_type_id,
  COUNT(DISTINCT ac.num_attempts) AS different_result_types
FROM relevant_results AS r
JOIN attempt_counts AS ac
ON ac.result_id = r.id
GROUP BY
  r.competition_id,
  r.event_id,
  r.round_type_id
HAVING different_result_types > IF(round_type_id IN ('c', 'd', 'e', 'g', 'h'), 2, 1);
