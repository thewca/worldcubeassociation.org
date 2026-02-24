SELECT distinct RIGHT(ce.competition_id, 4) as year,
                ce.competition_id,
                ce.event_id,
                re.round_type_id,
                ro.number                   as round_number,
                ro.cutoff
FROM rounds ro
       INNER JOIN competition_events ce ON ce.id = ro.competition_event_id
       INNER JOIN (SELECT DISTINCT competition_id, event_id, round_type_id FROM results) re
                  ON re.competition_id = ce.competition_id AND re.event_id = ce.event_id AND (CASE ro.number
                                                                                                WHEN ro.total_number_of_rounds
                                                                                                  THEN re.round_type_id IN ('c', 'f')
                                                                                                WHEN 0
                                                                                                  THEN re.round_type_id IN ('0', 'b', 'h')
                                                                                                WHEN 1
                                                                                                  THEN re.round_type_id IN ('1', 'd')
                                                                                                WHEN 2
                                                                                                  THEN re.round_type_id IN ('2', 'e')
                                                                                                WHEN 3
                                                                                                  THEN re.round_type_id IN ('3', 'g') END)
WHERE round_type_id in ('c', 'd', 'e', 'g', 'h')
  AND cutoff is NULL
ORDER BY year, competition_id, event_id, round_number
