WITH round_numbers AS (
  SELECT t0.*,
         ROW_NUMBER() OVER (
           PARTITION BY t0.competition_id, t0.event_id
           ORDER BY rt.`rank`
           ) AS round
  FROM (SELECT DISTINCT r.competition_id,
                        r.event_id,
                        r.round_type_id
        FROM results r) t0
         JOIN round_types rt ON t0.round_type_id = rt.id
),
     eligible_rounds AS (
       SELECT ro.id,
              ro.competition_event_id,
              ro.number,
              JSON_EXTRACT(ro.time_limit, '$.centiseconds') AS time_limit_cs
       FROM rounds ro
       WHERE ro.time_limit IS NOT NULL
         AND JSON_LENGTH(JSON_EXTRACT(ro.time_limit, '$.cumulativeRoundIds')) = 0
     )
SELECT r.person_id,
       r.competition_id,
       r.event_id,
       rn.round,
       r.round_type_id,
       ra.value,
       er.time_limit_cs AS time_limit
FROM eligible_rounds er
       JOIN competition_events ce ON ce.id = er.competition_event_id
       JOIN round_numbers rn
            ON rn.competition_id = ce.competition_id
              AND rn.event_id = ce.event_id
              AND rn.round = er.number
       JOIN results r
            ON r.competition_id = rn.competition_id
              AND r.event_id = rn.event_id
              AND r.round_type_id = rn.round_type_id
       JOIN result_attempts ra
            ON ra.result_id = r.id
              AND ra.value > er.time_limit_cs
WHERE er.time_limit_cs IS NOT NULL
