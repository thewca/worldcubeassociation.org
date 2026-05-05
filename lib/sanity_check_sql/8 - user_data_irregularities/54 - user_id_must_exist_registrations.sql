SELECT r.*
FROM registrations AS r
LEFT JOIN users AS u
ON r.user_id = u.id
WHERE u.id IS NULL;
