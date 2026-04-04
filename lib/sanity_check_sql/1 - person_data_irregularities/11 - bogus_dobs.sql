SELECT
  r.person_id,
  MIN(YEAR(c.start_date) - YEAR(p.dob)) AS min_age,
  MAX(YEAR(c.start_date) - YEAR(p.dob)) AS max_age,
  GROUP_CONCAT(c.id ORDER BY c.id) AS suspicious_competitions
FROM results AS r
INNER JOIN competitions AS c
ON r.competition_id = c.id
INNER JOIN persons AS p
ON p.wca_id = r.person_id
WHERE YEAR(p.dob) > 0
  AND (YEAR(c.start_date) - YEAR(p.dob) < 3 OR YEAR(c.start_date) - YEAR(p.dob) > 90)
GROUP BY r.person_id;
