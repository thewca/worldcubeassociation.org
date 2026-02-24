SELECT *
FROM registrations
WHERE user_id NOT IN (SELECT id FROM users);
