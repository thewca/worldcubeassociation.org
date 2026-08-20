SELECT *
FROM users
WHERE email LIKE 'wdc+%@worldcubeassociation.org'
  AND wca_id IS NULL;
