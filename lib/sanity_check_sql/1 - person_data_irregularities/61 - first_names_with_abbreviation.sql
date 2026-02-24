SELECT id, wca_id, name, country_id
FROM persons
WHERE name REGEXP '^[A-Za-z]\\. [A-Za-z]+$'
