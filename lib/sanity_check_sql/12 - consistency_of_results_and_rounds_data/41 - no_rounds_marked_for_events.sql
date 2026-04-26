SELECT
  ce.id,
  ce.competition_id,
  ce.event_id,
  ro.id
FROM competition_events AS ce
LEFT JOIN rounds AS ro
ON ce.id = ro.competition_event_id
JOIN competitions AS c
ON ce.competition_id = c.id
WHERE confirmed_at IS NOT NULL
  AND cancelled_by IS NOT NULL
HAVING ro.id IS NULL;
