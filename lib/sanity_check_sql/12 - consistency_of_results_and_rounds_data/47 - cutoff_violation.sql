WITH round_numbers AS (
  SELECT
    t0.*,
    ROW_NUMBER() OVER (
      PARTITION BY t0.competition_id, t0.event_id
      ORDER BY rt.`rank`
      ) AS round
  FROM (
         SELECT DISTINCT
           r.competition_id,
           r.event_id,
           r.round_type_id
         FROM results r
       ) t0
         JOIN round_types rt ON t0.round_type_id = rt.id
),
     rounds_with_cutoffs AS (
       SELECT
         ce.competition_id,
         ce.event_id,
         ro.number AS round_number,
         JSON_EXTRACT(ro.cutoff, '$.attemptResult') AS cutoff_time,
         JSON_EXTRACT(ro.cutoff, '$.numberOfAttempts') AS attempts_at_cutoff
       FROM rounds ro
              JOIN competition_events ce ON ce.id = ro.competition_event_id
       WHERE ro.cutoff IS NOT NULL
     ),
     results_with_cutoff_info AS (
       SELECT
         r.id AS result_id,
         rwc.cutoff_time,
         rwc.attempts_at_cutoff
       FROM results r
              JOIN round_numbers rn
                   ON rn.competition_id = r.competition_id
                     AND rn.event_id = r.event_id
                     AND rn.round_type_id = r.round_type_id
              JOIN rounds_with_cutoffs rwc
                   ON rwc.competition_id = rn.competition_id
                     AND rwc.event_id = rn.event_id
                     AND rwc.round_number = rn.round
     ),
     relevant_attempts AS (
       SELECT
         ra.result_id,
         rwci.cutoff_time,
         rwci.attempts_at_cutoff,
         MIN(CASE
               WHEN ra.value > 0 AND ra.attempt_number <= rwci.attempts_at_cutoff
                 THEN ra.value
           END) AS best_time_before_cutoff,
         COUNT(*) AS attempts
       FROM result_attempts ra
              JOIN results_with_cutoff_info rwci ON rwci.result_id = ra.result_id
       GROUP BY ra.result_id, rwci.cutoff_time, rwci.attempts_at_cutoff
     )
SELECT
  r.id,
  r.competition_id,
  r.event_id,
  rn.round,
  r.round_type_id,
  r.person_id,
  rela.best_time_before_cutoff,
  rela.cutoff_time,
  rela.attempts_at_cutoff,
  rela.attempts
FROM relevant_attempts rela
       JOIN results r ON r.id = rela.result_id
       JOIN round_numbers rn
            ON rn.competition_id = r.competition_id
              AND rn.event_id = r.event_id
              AND rn.round_type_id = r.round_type_id
WHERE rela.best_time_before_cutoff >= rela.cutoff_time
  AND rela.attempts > rela.attempts_at_cutoff
