SELECT
  co.id,
  co.organizer_id,
  co.competition_id
FROM competition_organizers AS co
LEFT JOIN users AS u
ON co.organizer_id = u.id
WHERE u.id IS NULL;
