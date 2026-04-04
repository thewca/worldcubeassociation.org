WITH attempt_sequences AS (
  SELECT
    result_id,
    GROUP_CONCAT(value ORDER BY attempt_number) AS attempt_sequence,
    COUNT(IF(value > 0, 1, NULL)) AS num_solves
  FROM result_attempts
  GROUP BY result_id
  HAVING num_solves > 1
)
SELECT
  attempt_sequence,
  COUNT(*) AS num_rows,
  GROUP_CONCAT(t1.id ORDER BY t1.id) AS result_ids,
  GROUP_CONCAT(DISTINCT person_id ORDER BY person_id) AS people,
  GROUP_CONCAT(DISTINCT event_id ORDER BY event_id) AS events,
  GROUP_CONCAT(DISTINCT competition_id ORDER BY competition_id) AS competition
FROM results AS t1
JOIN attempt_sequences AS t2
ON t2.result_id = t1.id
WHERE t1.event_id NOT IN ('333mbo', '333fm')
GROUP BY attempt_sequence
HAVING num_rows > 1
  AND COUNT(DISTINCT competition_id) = 1;
