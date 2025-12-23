SELECT *
FROM Results
WHERE average <> 0
  AND IF(value1 <> 0, 1, 0) + IF(value2 <> 0, 1, 0) + IF(value3 <> 0, 1, 0) + IF(value4 <> 0, 1, 0) +
      IF(value5 <> 0, 1, 0) <= 2
