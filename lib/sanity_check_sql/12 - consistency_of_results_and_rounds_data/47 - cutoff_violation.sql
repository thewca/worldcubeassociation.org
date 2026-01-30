SELECT
  r.id,
  r.competition_id,
  r.event_id,
  rd.number,
  r.round_type_id,
  r.person_id,
  -- Calculate best time within cutoff limits
  MIN(CASE
        WHEN ra.value > 0 AND ra.attempt_number <= JSON_EXTRACT(rd.cutoff, '$.numberOfAttempts')
          THEN ra.value
    END) AS best_time_before_cutoff,
  JSON_EXTRACT(rd.cutoff, '$.attemptResult') AS cutoff_time,
  JSON_EXTRACT(rd.cutoff, '$.numberOfAttempts') AS attempts_at_cutoff,
  COUNT(*) AS total_attempts
FROM results r
       JOIN rounds rd ON r.round_id = rd.id
       JOIN result_attempts ra ON r.id = ra.result_id
WHERE rd.cutoff IS NOT NULL
GROUP BY r.id
HAVING
   -- Logic: Best time in valid range is WORSE (>=) than cutoff
  best_time_before_cutoff >= cutoff_time
   -- Logic: But they proceeded to do more attempts anyway
   AND total_attempts > attempts_at_cutoff;
