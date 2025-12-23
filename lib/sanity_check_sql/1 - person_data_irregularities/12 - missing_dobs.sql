SELECT competition_id, count(distinct person_id) as missingDOBs
FROM results
       INNER JOIN persons ON results.person_id = persons.wca_id
WHERE (YEAR(persons.dob) = 0 OR persons.dob IS NULL)
  AND RIGHT(competition_id, 4) > 2018
GROUP BY competition_id
HAVING missingDOBs >= 3
ORDER BY missingDOBs DESC
