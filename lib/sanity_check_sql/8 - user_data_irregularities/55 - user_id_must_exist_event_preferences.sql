SELECT upe.*
FROM user_preferred_events AS upe
LEFT JOIN users AS u
ON upe.user_id = u.id
WHERE u.id IS NULL;
