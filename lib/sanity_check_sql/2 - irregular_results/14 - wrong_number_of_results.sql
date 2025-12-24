SELECT r.id, person_id, competition_id, event_id, round_type_id, f.expected_solve_count, COUNT(*) AS actual_solves
FROM results as r
       JOIN result_attempts ra ON ra.result_id = r.id
       JOIN formats f ON r.format_id = f.id
WHERE r.round_type_id NOT IN ('c', 'd', 'e', 'g', 'h')
GROUP BY result_id
HAVING COUNT(*) <> expected_solve_count
