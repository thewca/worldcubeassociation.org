SELECT *
FROM users
WHERE email LIKE '%@dummy.worldcubeassociation.org'
  AND wca_id IS NULL;
