SELECT ce.competition_id,
       ce.event_id,
       CAST(JSON_UNQUOTE(JSON_EXTRACT(time_limit, '$.centiseconds')) AS UNSIGNED INTEGER) AS time_limit,
       CAST(JSON_UNQUOTE(JSON_EXTRACT(cutoff, '$.attemptResult')) AS UNSIGNED INTEGER)    AS cutoff
FROM (SELECT * FROM rounds WHERE time_limit is not NULL and cutoff is not NULL) as ro
       INNER JOIN competition_events as ce on ce.id = ro.competition_event_id
       INNER JOIN (SELECT id FROM competitions WHERE announced_at is not NULL) as comps ON ce.competition_id = comps.id
HAVING time_limit > 0
   and time_limit < cutoff;
