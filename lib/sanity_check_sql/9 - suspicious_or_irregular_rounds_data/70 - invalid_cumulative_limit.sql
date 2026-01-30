SELECT *
FROM (SELECT competition_id, CONCAT(event_id, "-r", number) AS round_id, time_limit
      FROM rounds ro
             JOIN competition_events ce ON ro.competition_event_id = ce.id
      WHERE JSON_LENGTH(JSON_EXTRACT(time_limit, '$.cumulativeRoundIds')) > 0 # only apply to rounds with a cumulative time limit
        AND competition_id IN (SELECT competition_id FROM competitions WHERE announced_at IS NOT NULL AND cancelled_at IS NULL)) t1
WHERE LENGTH(REPLACE(time_limit, round_id, "")) = LENGTH(time_limit);
