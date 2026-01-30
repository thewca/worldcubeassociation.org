SELECT *
FROM users
where wca_id not in (SELECT wca_id FROM persons)
