WITH upcoming_competitions AS (
  SELECT
    id,
    start_date,
    end_date
  FROM competitions
  WHERE announced_by IS NOT NULL
    AND start_date >= CURDATE()
),
banned_persons AS (
  SELECT
    role.user_id,
    role.start_date AS start_date,
    role.end_date AS end_date,
    users.wca_id AS person_id,
    users.name AS person_name
  FROM user_roles AS role
  INNER JOIN user_groups
  ON role.group_id = user_groups.id
  LEFT JOIN users
  ON role.user_id = users.id
  WHERE user_groups.group_type = 'banned_competitors'
)
SELECT DISTINCT
  banned.person_name AS person_name,
  banned.person_id AS person_id,
  comps.id AS competition_id,
  comps.start_date AS competition_start_date,
  comps.end_date AS competition_end_date,
  banned.start_date AS ban_start_date,
  banned.end_date AS ban_end_date,
  (reg.deleted_at IS NOT NULL) AS deleted
FROM registrations AS reg
INNER JOIN upcoming_competitions AS comps
ON reg.competition_id = comps.id
INNER JOIN banned_persons AS banned
ON reg.user_id = banned.user_id
WHERE banned.start_date <= comps.start_date
  AND (banned.end_date IS NULL OR banned.end_date > comps.end_date)
  AND reg.accepted_at IS NOT NULL
  AND reg.deleted_at IS NULL;
