SELECT r.person_id,
       r.competition_id,
       r.event_id,
       ro.number AS round,
       r.round_type_id,
       ra.value,
       JSON_EXTRACT(ro.time_limit, '$.centiseconds') AS time_limit
FROM results r
       JOIN rounds ro ON r.round_id = ro.id
       JOIN result_attempts ra
            ON ra.result_id = r.id
WHERE ro.time_limit IS NOT NULL
  AND JSON_LENGTH(JSON_EXTRACT(ro.time_limit, '$.cumulativeRoundIds')) = 0
  AND JSON_EXTRACT(ro.time_limit, '$.centiseconds') IS NOT NULL
  AND ra.value > JSON_EXTRACT(ro.time_limit, '$.centiseconds')
  AND RIGHT(r.competition_id, 4) > 2013
