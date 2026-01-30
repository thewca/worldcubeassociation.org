SELECT GROUP_CONCAT(distinct competition_id ORDER BY competition_id) as competitions,
       GROUP_CONCAT(distinct event_id ORDER BY event_id)             AS events,
       GROUP_CONCAT(distinct round_type_id ORDER BY round_type_id)   AS round_type_ids,
       GROUP_CONCAT(distinct group_id ORDER BY group_id)             AS group_ids,
       scramble,
       count(id)                                                     AS scount,
       GROUP_CONCAT(id ORDER BY id)                                  AS scramble_ids
FROM (SELECT dups.scramble, id, competition_id, event_id, round_type_id, group_id
      FROM (SELECT scramble
            FROM scrambles
            WHERE event_id not in ('222', 'skewb')
            GROUP BY scramble
            HAVING count(*) > 1) dups
             INNER JOIN scrambles ON dups.scramble = scrambles.scramble) t
GROUP BY scramble
HAVING count(distinct competition_id) > 1
ORDER BY competitions, events, round_type_ids, group_ids
