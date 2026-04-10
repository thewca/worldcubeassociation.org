SELECT id, name, wca_id
FROM users
WHERE id > 1591
  AND id < 1630
  AND wca_id IS NULL;
