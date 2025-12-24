WITH grouped_results AS (
  SELECT
    r.competition_id,
    ra.result_id,
    r.person_id,
    r.round_type_id,
    r.event_id,
    MAX(CASE WHEN ra.attempt_number = 1 THEN ra.value END) AS value1,
    MAX(CASE WHEN ra.attempt_number = 2 THEN ra.value END) AS value2,
    MAX(CASE WHEN ra.attempt_number = 3 THEN ra.value END) AS value3,
    MAX(CASE WHEN ra.attempt_number = 4 THEN ra.value END) AS value4,
    MAX(CASE WHEN ra.attempt_number = 5 THEN ra.value END) AS value5,
    MAX(ra.value) AS worst
  FROM results r
         JOIN result_attempts ra ON ra.result_id = r.id
  WHERE event_id not in ('333mbo', '333fm')
  GROUP BY r.id HAVING worst > 0
)

SELECT value1, value2, value3, value4, value5, count(*) as num_rows, GROUP_CONCAT(distinct person_id) as people, GROUP_CONCAT(distinct event_id) as events, GROUP_CONCAT(distinct competition_id) as competitions FROM grouped_results
GROUP BY value1, value2, value3, value4, value5 HAVING num_rows > 1 AND COUNT(DISTINCT competition_id) = 1
