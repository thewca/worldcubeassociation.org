SELECT value1,
       value2,
       value3,
       value4,
       value5,
       count(*)                              as num_rows,
       GROUP_CONCAT(id ORDER BY id)          as result_ids,
       GROUP_CONCAT(person_id)               as people,
       GROUP_CONCAT(distinct event_id)       as events,
       GROUP_CONCAT(distinct competition_id) as competitions
FROM results
WHERE event_id not in ('333mbo', '333fm')
  AND
  IF(value1 > 0, 1, 0) + IF(value2 > 0, 1, 0) + IF(value3 > 0, 1, 0) + IF(value4 > 0, 1, 0) + IF(value5 > 0, 1, 0) > 1
GROUP BY value1, value2, value3, value4, value5
HAVING num_rows > 1
   AND count(distinct competition_id) = 1
