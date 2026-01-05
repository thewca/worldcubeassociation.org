SELECT r.person_id, MIN(YEAR(c.start_date)) as first_year
FROM results r
       INNER JOIN competitions c ON r.competition_id = c.id
GROUP BY person_id
HAVING first_year <> LEFT(person_id, 4)
