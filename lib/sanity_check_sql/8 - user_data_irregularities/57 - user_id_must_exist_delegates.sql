SELECT id, delegate_id, competition_id
FROM competition_delegates
WHERE delegate_id NOT in (SELECT id FROM users);
