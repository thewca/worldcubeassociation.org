SELECT p.wca_id, sub_id, p.name, country_id FROM persons AS p LEFT JOIN countries AS c ON p.country_id = c.id WHERE c.id is NULL
