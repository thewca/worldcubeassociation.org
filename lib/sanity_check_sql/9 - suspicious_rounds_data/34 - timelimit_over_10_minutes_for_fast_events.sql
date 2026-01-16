SELECT ce.competition_id,
       ce.event_id,
       CAST(JSON_UNQUOTE(JSON_EXTRACT(time_limit, '$.centiseconds')) AS UNSIGNED INTEGER) AS time_limit
FROM (SELECT * FROM rounds WHERE time_limit LIKE '%[]%') as ro
       INNER JOIN (SELECT *
                   FROM competition_events
                   WHERE event_id in ('333', '222', '444', '333oh', 'clock', 'mega', 'pyram', 'skewb', 'sq1')) as ce
                  ON ce.id = ro.competition_event_id
       INNER JOIN (SELECT id FROM competitions WHERE announced_at is not NULL) as comps ON ce.competition_id = comps.id
HAVING time_limit > 60000
