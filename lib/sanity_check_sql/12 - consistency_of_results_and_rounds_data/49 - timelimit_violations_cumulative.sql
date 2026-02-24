WITH aggregated_attempts AS (
  SELECT
    result_id,
    SUM(IF(value > 0, value, 0)) AS total_time
  FROM result_attempts
  GROUP BY result_id
)
SELECT r.person_id,
       r.competition_id,
       JSON_EXTRACT(ro.time_limit, '$.cumulativeRoundIds') AS rounds,
       SUM(aa.total_time) AS total_time,
       JSON_EXTRACT(ro.time_limit, '$.centiseconds') AS time_limit
FROM results r
       JOIN aggregated_attempts aa ON aa.result_id = r.id
       JOIN rounds ro ON r.round_id = ro.id
WHERE JSON_LENGTH(JSON_EXTRACT(ro.time_limit, '$.cumulativeRoundIds')) > 0
GROUP BY r.competition_id,
         r.person_id,
         JSON_EXTRACT(ro.time_limit, '$.cumulativeRoundIds'),
         JSON_EXTRACT(ro.time_limit, '$.centiseconds')
HAVING total_time >= time_limit
