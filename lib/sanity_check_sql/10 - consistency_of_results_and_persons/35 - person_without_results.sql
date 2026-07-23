SELECT p.*
FROM persons AS p
LEFT JOIN results AS r
ON p.wca_id = r.person_id
WHERE r.person_id IS NULL;
