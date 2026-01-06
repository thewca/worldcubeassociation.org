SELECT *
FROM results as r
       INNER JOIN formats as f ON r.format_id = f.id
WHERE r.round_type_id not in ('c', 'd', 'e', 'g', 'h')
  AND f.expected_solve_count <>
      IF(value1 <> 0, 1, 0) + IF(value2 <> 0, 1, 0) + IF(value3 <> 0, 1, 0) + IF(value4 <> 0, 1, 0) +
      IF(value5 <> 0, 1, 0)
