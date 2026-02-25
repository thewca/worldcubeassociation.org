SELECT DISTINCT res.person_name      AS PersonName,
                res.person_id        AS person_id,
                comps.competition_id AS competition_id,
                comps.start_date     AS CompetitionStartDate,
                comps.end_date       AS CompetitionEndDate,
                banned.start_date    AS BanStartDate,
                banned.end_date      AS BanEndDate
FROM results AS res
       INNER JOIN (SELECT competition_id, start_date, end_date FROM competitions WHERE results_posted_by is NOT NULL) AS comps
                  ON res.competition_id = comps.competition_id
       INNER JOIN (SELECT role.user_id,
                          role.start_date AS start_date,
                          role.end_date   AS end_date,
                          users.wca_id    AS person_id,
                          users.name      AS person_name
                   FROM user_roles AS role
                          INNER JOIN user_groups ON role.group_id = user_groups.id
                          LEFT JOIN users ON role.user_id = users.id
                   WHERE user_groups.group_type = 'banned_competitors') AS banned ON res.person_id = banned.person_id
WHERE banned.start_date <= comps.start_date
  AND (banned.end_date IS NULL OR banned.end_date > comps.end_date);
