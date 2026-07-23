SELECT
  r.person_id,
  MIN(YEAR(c.start_date)) AS first_year
FROM results AS r
INNER JOIN competitions AS c
ON r.competition_id = c.id
GROUP BY person_id
HAVING first_year <> LEFT(person_id, 4);
