SELECT DISTINCT c.id
FROM competitions AS c
INNER JOIN results AS r
ON c.id = r.competition_id
WHERE c.results_posted_by IS NULL
  AND c.announced_at IS NOT NULL;
