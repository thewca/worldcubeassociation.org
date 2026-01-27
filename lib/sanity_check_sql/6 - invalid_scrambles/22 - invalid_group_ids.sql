SELECT distinct group_id
FROM scrambles
WHERE CAST(group_id AS BINARY) NOT REGEXP BINARY '^[A-Z]+$'
