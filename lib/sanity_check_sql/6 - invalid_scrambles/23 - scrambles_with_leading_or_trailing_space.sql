SELECT *
FROM scrambles
WHERE LENGTH(scramble) != LENGTH(TRIM(scramble))
