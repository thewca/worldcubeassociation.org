WITH num_solves AS (
  SELECT result_id, COUNT(*) AS actual_solves
  FROM result_attempts
  GROUP BY result_id
)

SELECT r.id, r.person_id, r.competition_id, r.event_id, r.round_type_id, f.expected_solve_count, t2.actual_solves
FROM results r
       JOIN formats f ON r.format_id = f.id
       JOIN num_solves t2 ON t2.result_id = r.id
WHERE r.round_type_id NOT IN ('c', 'd', 'e', 'g', 'h')
  AND t2.actual_solves <> f.expected_solve_count;
