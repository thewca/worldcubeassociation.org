SELECT
  competition_id,
  COUNT(DISTINCT person_id) AS missing_dobs
FROM results
INNER JOIN persons
ON results.person_id = persons.wca_id
WHERE (YEAR(persons.dob) = 0 OR persons.dob IS NULL)
  AND RIGHT(competition_id, 4) > 2018
GROUP BY competition_id
HAVING missing_dobs >= 3
ORDER BY missing_dobs DESC;
