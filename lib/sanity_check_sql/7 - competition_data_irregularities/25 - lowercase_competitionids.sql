SELECT id
FROM competitions
WHERE announced_at IS NOT NULL
  AND CAST(id AS BINARY) REGEXP BINARY '^[a-z]';
