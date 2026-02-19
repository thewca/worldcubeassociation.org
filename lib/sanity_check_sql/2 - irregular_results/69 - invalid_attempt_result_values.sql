SELECT id, value, attempt_number, result_id
FROM result_attempts
WHERE value = 0 OR value < -2;
