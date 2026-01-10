SELECT *
FROM user_preferred_events
WHERE user_id NOT IN (SELECT id From users);
