SELECT id, organizer_id, competition_id
FROM competition_organizers
WHERE organizer_id NOT in (SELECT id FROM users);
