WITH announced_competitions AS (
  SELECT id
  FROM competitions
  WHERE announced_at IS NOT NULL
    AND cancelled_at IS NULL
),
cumulative_rounds AS (
  SELECT
    ce.competition_id,
    CONCAT(ce.event_id, '-r', ro.number) AS round_id,
    ro.time_limit
  FROM rounds AS ro
  JOIN competition_events AS ce
  ON ro.competition_event_id = ce.id
  JOIN announced_competitions AS ac
  ON ce.competition_id = ac.id
  WHERE JSON_LENGTH(JSON_EXTRACT(ro.time_limit, '$.cumulativeRoundIds')) > 0 -- only apply to rounds with a cumulative time limit
)
SELECT *
FROM cumulative_rounds
WHERE LENGTH(REPLACE(time_limit, round_id, '')) = LENGTH(time_limit);
