SELECT distinct RIGHT(ce.competition_id, 4)                                                         as year,
                ce.competition_id,
                ce.event_id,
                rounds_rounds,
                result_rounds,
                id_list,
                IF(rounds_rounds < result_rounds, 'rounds entry missing', 'excessive rounds entry') as problem_case
FROM competition_events as ce
       INNER JOIN (SELECT competition_event_id, count(*) as rounds_rounds
                   FROM rounds
                   GROUP BY competition_event_id) as ro ON ce.id = ro.competition_event_id
       INNER JOIN (SELECT competition_id,
                          event_id,
                          count(*)                                                          as result_rounds,
                          GROUP_CONCAT(round_type_id ORDER BY round_type_id SEPARATOR ', ') as id_list
                   FROM (SELECT distinct competition_id, event_id, round_type_id FROM results) t
                   GROUP BY competition_id, event_id) as res
                  ON ce.competition_id = res.competition_id AND ce.event_id = res.event_id AND
                     rounds_rounds <> result_rounds
ORDER BY year, problem_case, competition_id, event_id
