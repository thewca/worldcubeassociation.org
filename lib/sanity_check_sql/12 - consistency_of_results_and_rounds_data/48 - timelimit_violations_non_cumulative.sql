WITH round_numbers AS (SELECT t0.*,
                              ROW_NUMBER() OVER (
                                PARTITION BY t0.competition_id, t0.event_id
                                ORDER BY rt.`rank`
                                ) AS round
                       FROM (SELECT DISTINCT r.competition_id,
                                             r.event_id,
                                             r.round_type_id
                             FROM results r) t0
                              JOIN round_types rt ON t0.round_type_id = rt.id)

SELECT r.person_id,
       r.competition_id,
       r.event_id,
       rn.round,
       r.round_type_id,
       ra.value,
       JSON_EXTRACT(time_limit, '$.centiseconds') AS time_limit
FROM results r
       JOIN result_attempts ra ON ra.result_id = r.id
       JOIN competition_events ce
            ON r.competition_id = ce.competition_id
              AND r.event_id = ce.event_id
       JOIN round_numbers rn
            ON rn.competition_id = r.competition_id
              AND rn.event_id = r.event_id
              AND rn.round_type_id = r.round_type_id
       JOIN rounds ro
            ON ce.id = ro.competition_event_id
              AND ro.number = rn.round
WHERE JSON_LENGTH(JSON_EXTRACT(time_limit, '$.cumulativeRoundIds')) = 0
# only apply to rounds without a cumulative time limit
  AND value > JSON_EXTRACT(time_limit, '$.centiseconds')
