SELECT competition_id,
       GROUP_CONCAT(distinct event_id ORDER BY event_id)           AS events,
       GROUP_CONCAT(distinct round_type_id ORDER BY round_type_id) AS round_type_ids,
       GROUP_CONCAT(distinct group_id ORDER BY group_id)           AS group_ids,
       scramble,
       count(id)                                                   AS scount,
       GROUP_CONCAT(id ORDER BY id)                                AS scramble_ids
FROM (SELECT dups.scramble, id, s.competition_id, event_id, round_type_id, group_id
      FROM (SELECT competition_id, scramble FROM scrambles GROUP BY competition_id, scramble HAVING count(*) > 1) dups
             INNER JOIN scrambles as s ON dups.competition_id = s.competition_id AND dups.scramble = s.scramble) t
GROUP BY competition_id, scramble
ORDER BY competition_id, events, round_type_ids, group_ids
