SELECT result_id, MAX(attempt_number) AS max_attempt_number, COUNT(*) AS num_attempts
FROM result_attempts
GROUP BY result_id
HAVING max_attempt_number > num_attempts
