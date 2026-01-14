WITH attempt_sequences AS (SELECT result_id,
                                  GROUP_CONCAT(value ORDER BY attempt_number) AS attempt_sequence,
                                  MAX(value)                                  AS worst
                           FROM result_attempts
                           GROUP BY result_id
                           HAVING worst > 0)

SELECT attempt_sequence,
       count(*)                              as num_rows,
       GROUP_CONCAT(t1.id ORDER BY t1.id)    as result_ids,
       GROUP_CONCAT(distinct person_id)      as people,
       GROUP_CONCAT(distinct event_id)       as events,
       GROUP_CONCAT(distinct competition_id) as competitions
FROM results t1
       JOIN attempt_sequences t2 ON t2.result_id = t1.id
WHERE t1.event_id NOT IN ('333mbo', '333fm')
GROUP BY attempt_sequence
HAVING num_rows > 1
   AND COUNT(DISTINCT competition_id) = 1
