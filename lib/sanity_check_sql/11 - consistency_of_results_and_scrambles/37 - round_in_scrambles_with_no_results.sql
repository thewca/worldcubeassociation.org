SELECT distinct s.competition_id, s.event_id, s.round_type_id
FROM (SELECT distinct competition_id, event_id, round_type_id FROM scrambles) as s
       LEFT JOIN (SELECT distinct competition_id FROM results) as r_comps ON s.competition_id = r_comps.competition_id
       LEFT JOIN (SELECT distinct competition_id, event_id, round_type_id FROM results) as r_rounds
                 ON s.competition_id = r_rounds.competition_id AND s.event_id = r_rounds.event_id AND
                    s.round_type_id = r_rounds.round_type_id
WHERE r_comps.competition_id is not NULL
  AND r_rounds.competition_id is NULL
ORDER BY s.competition_id, s.event_id, s.round_type_id
