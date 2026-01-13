WITH grouped_attempts AS (SELECT result_id,
                                 MAX(CASE WHEN attempt_number = 1 THEN value END) AS value1,
                                 MAX(CASE WHEN attempt_number = 2 THEN value END) AS value2,
                                 MAX(CASE WHEN attempt_number = 3 THEN value END) AS value3,
                                 MAX(CASE WHEN attempt_number = 4 THEN value END) AS value4,
                                 MAX(CASE WHEN attempt_number = 5 THEN value END) AS value5,
                                 MAX(value)                                       AS worst
                          FROM result_attempts
                          GROUP BY result_id
                          HAVING worst > 0)

SELECT t2.value1,
       t2.value2,
       t2.value3,
       t2.value4,
       t2.value5,
       count(*)                              as num_rows,
       GROUP_CONCAT(distinct person_id)      as people,
       GROUP_CONCAT(distinct event_id)       as events,
       GROUP_CONCAT(distinct competition_id) as competitions
FROM results t1
       JOIN grouped_attempts t2 ON t2.result_id = t1.id
WHERE t1.event_id NOT IN ('333mbo', '333fm')
GROUP BY value1, value2, value3, value4, value5
HAVING num_rows > 1
   AND COUNT(DISTINCT competition_id) = 1
