SELECT re.competition_id, IFNULL(ce_number_of_events, 0) ce_number_of_events, results_number_of_events
FROM (SELECT competition_id, COUNT(*) ce_number_of_events FROM competition_events GROUP BY competition_id) cee
       RIGHT JOIN (SELECT competition_id, COUNT(DISTINCT event_id) results_number_of_events
                   FROM results
                   GROUP BY competition_id) re ON cee.competition_id = re.competition_id
HAVING ce_number_of_events <> results_number_of_events
