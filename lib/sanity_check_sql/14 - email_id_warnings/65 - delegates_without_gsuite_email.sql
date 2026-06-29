WITH RECURSIVE group_ancestors AS (
  SELECT id, parent_group_id, id AS leaf_group_id
  FROM user_groups
  WHERE group_type = 'delegate_regions'

  UNION ALL

  SELECT ug.id, ug.parent_group_id, ga.leaf_group_id
  FROM user_groups ug
  JOIN group_ancestors ga ON ug.id = ga.parent_group_id
),
root_groups AS (
  SELECT id AS root_group_id, leaf_group_id
  FROM group_ancestors
  WHERE parent_group_id IS NULL
)
SELECT
  u.wca_id,
  u.name,
  ur.start_date AS promotion_date,
  u.email,
  ug.name AS region,
  dr.location,
  sd.name AS senior_delegate,
  root_ug.name AS senior_region
FROM users AS u
JOIN user_roles AS ur
ON ur.user_id = u.id
JOIN user_groups AS ug
ON ur.group_id = ug.id
JOIN roles_metadata_delegate_regions AS dr
ON ur.metadata_type = 'RolesMetadataDelegateRegions'
  AND ur.metadata_id = dr.id
  AND ug.metadata_type = 'GroupsMetadataDelegateRegions'
JOIN root_groups rg
ON rg.leaf_group_id = ug.id
JOIN user_groups root_ug
ON root_ug.id = rg.root_group_id
JOIN user_roles sd_role
ON sd_role.group_id = rg.root_group_id
  AND sd_role.end_date IS NULL
JOIN roles_metadata_delegate_regions sd_dr
ON sd_role.metadata_type = 'RolesMetadataDelegateRegions'
  AND sd_role.metadata_id = sd_dr.id
  AND sd_dr.status = 'senior_delegate'
JOIN users sd
ON sd_role.user_id = sd.id
WHERE ur.end_date IS NULL
  AND dr.status <> 'trainee_delegate'
  AND u.email NOT LIKE '%@worldcubeassociation.org'
ORDER BY promotion_date;
