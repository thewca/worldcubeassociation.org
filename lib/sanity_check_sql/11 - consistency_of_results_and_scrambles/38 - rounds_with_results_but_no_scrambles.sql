SELECT distinct r.competition_id, r.event_id, r.round_type_id
FROM (SELECT distinct competition_id, event_id, round_type_id FROM results) as r
       LEFT JOIN (SELECT distinct competition_id FROM scrambles) as s_comps ON r.competition_id = s_comps.competition_id
       LEFT JOIN (SELECT distinct competition_id, event_id, round_type_id FROM scrambles) as s_rounds
                 ON r.competition_id = s_rounds.competition_id AND r.event_id = s_rounds.event_id AND
                    r.round_type_id = s_rounds.round_type_id
WHERE s_comps.competition_id is not NULL
  AND s_rounds.competition_id is NULL
ORDER BY r.competition_id, r.event_id, r.round_type_id
