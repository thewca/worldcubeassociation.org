SELECT
  cd.id,
  cd.delegate_id,
  cd.competition_id
FROM competition_delegates AS cd
LEFT JOIN users AS u
ON cd.delegate_id = u.id
WHERE u.id IS NULL;
