SELECT u.*
FROM users AS u
LEFT JOIN persons AS p
ON u.wca_id = p.wca_id
WHERE p.wca_id IS NULL;
