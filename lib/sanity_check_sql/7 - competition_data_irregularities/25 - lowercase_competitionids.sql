SELECT competition_id FROM competitions WHERE announced_at is not NULL and CAST(competition_id AS BINARY) REGEXP BINARY '^[a-z]'
