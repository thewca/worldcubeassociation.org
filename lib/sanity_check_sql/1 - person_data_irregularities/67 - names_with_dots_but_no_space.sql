SELECT *
FROM persons
WHERE name REGEXP '\\.[^ \\n\\r\\t]'
  AND name NOT LIKE '%.'
