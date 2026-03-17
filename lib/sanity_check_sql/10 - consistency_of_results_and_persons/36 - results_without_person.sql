SELECT *
FROM results
WHERE person_id NOT IN (SELECT wca_id FROM persons)
