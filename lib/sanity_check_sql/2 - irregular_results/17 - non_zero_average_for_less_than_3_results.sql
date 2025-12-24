SELECT r.id, person_id, competition_id, round_type_id, average, COUNT(*) AS solves
FROM results r
       JOIN result_attempts ra ON ra.result_id = r.id
WHERE average <> 0
GROUP BY result_id
HAVING COUNT(*) <= 2
