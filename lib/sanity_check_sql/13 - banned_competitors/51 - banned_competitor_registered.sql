SELECT DISTINCT banned.person_name           AS PersonName,
                banned.person_id             AS person_id,
                comps.id                     AS competition_id,
                comps.start_date             AS CompetitionStartDate,
                comps.end_date               AS CompetitionEndDate,
                comps.end_date               AS CompetitionEndDate,
                banned.start_date            AS BanStartDate,
                banned.end_date              AS BanEndDate,
                (NOT reg.deleted_at is Null) As Deleted
FROM registrations AS reg
       INNER JOIN (SELECT id, start_date, end_date
                   FROM competitions
                   WHERE announced_by is not NULL
                     AND start_date >= CURDATE()) AS comps ON reg.competition_id = comps.id
       INNER JOIN (SELECT role.user_id,
                          role.start_date AS start_date,
                          role.end_date   AS end_date,
                          users.wca_id    AS person_id,
                          users.name      AS person_name
                   FROM user_roles AS role
                          INNER JOIN user_groups ON role.group_id = user_groups.id
                          LEFT JOIN users ON role.user_id = users.id
                   WHERE user_groups.group_type = 'banned_competitors') AS banned ON reg.user_id = banned.user_id
WHERE banned.start_date <= comps.start_date
  AND (banned.end_date IS NULL OR banned.end_date > comps.end_date)
  AND reg.accepted_at is not NULL
  AND reg.deleted_at is NULL;
