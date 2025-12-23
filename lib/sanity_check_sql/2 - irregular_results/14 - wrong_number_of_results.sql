SELECT *
FROM Results as r
       INNER JOIN Formats as f ON r.formatId = f.id
WHERE r.roundTypeId not in ('c', 'd', 'e', 'g', 'h')
  AND f.expected_solve_count <>
      IF(value1 <> 0, 1, 0) + IF(value2 <> 0, 1, 0) + IF(value3 <> 0, 1, 0) + IF(value4 <> 0, 1, 0) +
      IF(value5 <> 0, 1, 0)
