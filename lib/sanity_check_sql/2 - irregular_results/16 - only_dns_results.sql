SELECT result_id
FROM result_attempts
GROUP BY result_id
HAVING MAX(value) = -2;
