SELECT
  ur.user_id,
  u.name AS user_name,
  ug.name AS group_name,
  ug.group_type,
  ur.start_date,
  ur.end_date,
  ur.metadata_id,
  ur.metadata_type,
  ur.created_at,
  ur.updated_at
FROM user_roles AS ur
INNER JOIN user_groups AS ug
ON ur.group_id = ug.id
INNER JOIN users AS u
ON ur.user_id = u.id
WHERE end_date - start_date <= 1
ORDER BY ur.created_at, ur.user_id;
