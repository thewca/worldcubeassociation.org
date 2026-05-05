WITH announced_competitions AS (
  SELECT
    id,
    start_date,
    end_date
  FROM competitions
  WHERE results_posted_by IS NOT NULL
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
  res.person_name AS person_name,
  res.person_id AS person_id,
  comps.id AS competition_id,
  comps.start_date AS competition_start_date,
  comps.end_date AS competition_end_date,
  banned.start_date AS ban_start_date,
  banned.end_date AS ban_end_date
FROM results AS res
INNER JOIN announced_competitions AS comps
ON res.competition_id = comps.id
INNER JOIN banned_persons AS banned
ON res.person_id = banned.person_id
WHERE banned.start_date <= comps.start_date
  AND (banned.end_date IS NULL OR banned.end_date > comps.end_date);
