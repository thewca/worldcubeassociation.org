SELECT result_id
FROM result_attempts
GROUP BY result_id
HAVING MIN(attempt_number) > 1
