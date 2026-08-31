WITH valid_rounds AS (
  SELECT *
  FROM rounds
  WHERE time_limit IS NOT NULL
    AND cutoff IS NOT NULL
),
announced_competitions AS (
  SELECT id
  FROM competitions
  WHERE announced_at IS NOT NULL
)
SELECT
  ce.competition_id,
  ce.event_id,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(ro.time_limit, '$.centiseconds')) AS UNSIGNED INTEGER) AS time_limit,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(ro.cutoff, '$.attemptResult')) AS UNSIGNED INTEGER) AS cutoff
FROM valid_rounds AS ro
INNER JOIN competition_events AS ce
ON ce.id = ro.competition_event_id
INNER JOIN announced_competitions AS comps
ON ce.competition_id = comps.id
HAVING time_limit > 0
  AND time_limit < cutoff;
