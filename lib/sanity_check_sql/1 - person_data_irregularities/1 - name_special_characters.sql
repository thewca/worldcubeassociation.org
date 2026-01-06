SELECT *
FROM persons
WHERE name REGEXP '["0-9_@#`$^&*\\\\|}{\\[\\]+=?><,~]'
