SELECT r.*
FROM results AS r
LEFT JOIN persons AS p
ON r.person_id = p.wca_id
WHERE p.wca_id IS NULL;
