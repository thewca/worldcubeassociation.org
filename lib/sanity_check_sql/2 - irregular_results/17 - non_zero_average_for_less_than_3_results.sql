WITH target_result_ids AS (SELECT result_id, COUNT(*) AS solves
                           FROM result_attempts
                           GROUP BY result_id
                           HAVING solves <= 2)

SELECT r.id, r.person_id, r.competition_id, r.round_type_id, r.average, t2.solves
FROM results r
       JOIN target_result_ids t2 ON t2.result_id = r.id
WHERE average <> 0
