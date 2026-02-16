SELECT id FROM competitions WHERE announced_at is not NULL and CAST(id AS BINARY) REGEXP BINARY '^[a-z]'
