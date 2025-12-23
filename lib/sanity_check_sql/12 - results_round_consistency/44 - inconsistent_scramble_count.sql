SELECT ce.competition_id,
       ce.event_id,
       ro.number             as round_number,
       ro.scramble_set_count as roundsScrambleCount,
       scramblesScrambleCount
FROM rounds ro
       INNER JOIN competition_events ce ON ce.id = ro.competition_event_id
       INNER JOIN (SELECT competition_id, event_id, round_type_id, COUNT(*) as scramblesScrambleCount
                   FROM (SELECT DISTINCT competition_id, event_id, round_type_id, group_id FROM scrambles) t
                   GROUP BY competition_id, event_id, round_type_id) sc
                  ON sc.competition_id = ce.competition_id AND sc.event_id = ce.event_id AND (CASE ro.number
                                                                                                WHEN ro.total_number_of_rounds
                                                                                                  THEN sc.round_type_id IN ('c', 'f')
                                                                                                WHEN 0
                                                                                                  THEN sc.round_type_id IN ('0', 'b', 'h')
                                                                                                WHEN 1
                                                                                                  THEN sc.round_type_id IN ('1', 'd')
                                                                                                WHEN 2
                                                                                                  THEN sc.round_type_id IN ('2', 'e')
                                                                                                WHEN 3
                                                                                                  THEN sc.round_type_id IN ('3', 'g') END)
WHERE ro.scramble_set_count <> scramblesScrambleCount
