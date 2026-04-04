SELECT id, start_date, end_date
FROM competitions
WHERE announced_at IS NOT NULL
  AND RIGHT(id, 4) <> YEAR(start_date)
  AND RIGHT(id, 4) <> YEAR(end_date);
