SELECT *
FROM users
WHERE email LIKE '%@dummy.worldcubeassociation.org'
  and wca_id IS NULL;
