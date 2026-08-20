WITH rounds_with_empty_cumulative AS (
  SELECT *
  FROM rounds
  WHERE time_limit LIKE '%[]%'
),
fast_events AS (
  SELECT *
  FROM competition_events
  WHERE event_id IN ('333', '222', '444', '333oh', 'clock', 'mega', 'pyram', 'skewb', 'sq1')
),
announced_competitions AS (
  SELECT id
  FROM competitions
  WHERE announced_at IS NOT NULL
)
SELECT
  ce.competition_id,
  ce.event_id,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(ro.time_limit, '$.centiseconds')) AS UNSIGNED INTEGER) AS time_limit
FROM rounds_with_empty_cumulative AS ro
INNER JOIN fast_events AS ce
ON ce.id = ro.competition_event_id
INNER JOIN announced_competitions AS comps
ON ce.competition_id = comps.id
HAVING time_limit > 60000;
