WITH rounds_with_cutoff AS (
  SELECT *
  FROM rounds
  WHERE cutoff IS NOT NULL
),
non_fm_events AS (
  SELECT *
  FROM competition_events
  WHERE event_id <> '333fm'
),
announced_competitions AS (
  SELECT id
  FROM competitions
  WHERE announced_at IS NOT NULL
)
SELECT
  ce.competition_id,
  ce.event_id,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(ro.cutoff, '$.attemptResult')) AS UNSIGNED INTEGER) AS cutoff
FROM rounds_with_cutoff AS ro
INNER JOIN non_fm_events AS ce
ON ce.id = ro.competition_event_id
INNER JOIN announced_competitions AS comps
ON ce.competition_id = comps.id
HAVING cutoff < 500;
