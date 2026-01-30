SELECT ce.id, ce.competition_id, ce.event_id, ro.id
FROM competition_events ce
       LEFT JOIN rounds ro ON ce.id = ro.competition_event_id
       JOIN competitions c ON ce.competition_id = c.competition_id
WHERE confirmed_at is NOT NULL
  AND cancelled_by is not NULL
HAVING ro.id is NULL
