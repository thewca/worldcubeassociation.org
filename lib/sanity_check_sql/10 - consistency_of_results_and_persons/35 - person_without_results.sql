SELECT *
FROM persons
WHERE wca_id NOT IN (SELECT person_id FROM results)
