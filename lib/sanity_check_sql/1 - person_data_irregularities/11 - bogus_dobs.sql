SELECT
  R.person_id,
  MIN(YEAR(C.start_date) - YEAR(P.dob)) AS min_age,
  MAX(YEAR(C.start_date) - YEAR(P.dob)) AS max_age,
  GROUP_CONCAT(C.id) AS suspicious_competitions
FROM results AS R
INNER JOIN competitions AS C
ON R.competition_id = C.id
INNER JOIN persons AS P
ON P.wca_id = R.person_id
WHERE YEAR(P.dob) > 0
  AND (YEAR(C.start_date) - YEAR(P.dob) < 3 OR YEAR(C.start_date) - YEAR(P.dob) > 90)
GROUP BY R.person_id;
