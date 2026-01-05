SELECT DISTINCT ce.id, r.competition_id, r.event_id
FROM results r
       LEFT JOIN competition_events ce ON r.competition_id = ce.competition_id AND r.event_id = ce.event_id
HAVING ce.id is NULL
