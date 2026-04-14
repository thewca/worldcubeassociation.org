SELECT u.*
FROM users AS u
LEFT JOIN persons AS p
ON u.wca_id = p.wca_id
WHERE u.wca_id IS NOT NULL
  AND p.wca_id IS NULL;
