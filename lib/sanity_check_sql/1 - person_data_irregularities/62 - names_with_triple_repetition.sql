SELECT *
FROM persons
WHERE name REGEXP '.*([A-Za-z])\\1{2}.*'
  AND name NOT LIKE '% III'
