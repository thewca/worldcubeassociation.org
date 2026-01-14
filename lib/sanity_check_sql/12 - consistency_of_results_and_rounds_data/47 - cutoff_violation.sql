WITH round_numbers AS (SELECT t0.*,
                              ROW_NUMBER() OVER (
                                PARTITION BY t0.competition_id, t0.event_id
                                ORDER BY rt.`rank`
                                ) AS round
                       FROM (SELECT DISTINCT r.competition_id,
                                             r.event_id,
                                             r.round_type_id
                             FROM results r) t0
                              JOIN round_types rt ON t0.round_type_id = rt.id),
     rounds_with_cutoffs AS (SELECT ce.competition_id,
                                    ce.event_id,
                                    ro.number                                     AS round_number,
                                    JSON_EXTRACT(ro.cutoff, '$.attemptResult')    AS cutoff_time,
                                    JSON_EXTRACT(ro.cutoff, '$.numberOfAttempts') AS attempts_at_cutoff
                             FROM rounds ro
                                    JOIN competition_events ce ON ce.id = ro.competition_event_id
                             WHERE ro.cutoff IS NOT NULL)
SELECT r.id,
       r.competition_id,
       r.event_id,
       rn.round,
       r.round_type_id,
       r.person_id,
       MIN(CASE
             WHEN ra.value > 0 AND ra.attempt_number <= rwc.attempts_at_cutoff
               THEN ra.value END) AS best_time_before_cutoff,
       rwc.cutoff_time,
       rwc.attempts_at_cutoff,
       COUNT(*)                   AS attempts
FROM rounds_with_cutoffs rwc
       JOIN round_numbers rn
            ON rn.competition_id = rwc.competition_id
              AND rn.event_id = rwc.event_id
              AND rn.round = rwc.round_number
       JOIN results r
            ON r.competition_id = rn.competition_id
              AND r.event_id = rn.event_id
              AND r.round_type_id = rn.round_type_id
       JOIN result_attempts ra ON ra.result_id = r.id
GROUP BY r.id, rwc.cutoff_time, rwc.attempts_at_cutoff
HAVING best_time_before_cutoff >= cutoff_time
   AND attempts > attempts_at_cutoff
