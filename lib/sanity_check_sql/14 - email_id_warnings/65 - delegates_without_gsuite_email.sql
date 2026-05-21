SELECT
  u.wca_id,
  u.name,
  start_date AS promotion_date,
  u.email
FROM users AS u
JOIN user_roles AS ur
ON ur.user_id = u.id
JOIN user_groups AS ug
ON ur.group_id = ug.id
JOIN roles_metadata_delegate_regions AS dr
ON ur.metadata_type = 'RolesMetadataDelegateRegions'
  AND ur.metadata_id = dr.id
  AND ug.metadata_type = 'GroupsMetadataDelegateRegions'
WHERE end_date IS NULL
  AND dr.status <> 'trainee_delegate'
  AND email NOT LIKE '%@worldcubeassociation.org'
ORDER BY promotion_date;
