SELECT id, competition_id, event_id
FROM scrambles
WHERE scramble like "%\r\n%"
