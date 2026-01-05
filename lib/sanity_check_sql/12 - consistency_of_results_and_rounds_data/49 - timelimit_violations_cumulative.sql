SELECT ro.id, COUNT(*) AS noOfRounds, SUM(IF(value1<0,0,value1)+IF(value2<0,0,value2)+IF(value3<0,0,value3)+IF(value4<0,0,value4)+IF(value5<0,0,value5)) AS sumOfSolves,
       REVERSE(SUBSTRING_INDEX(REVERSE(SUBSTRING_INDEX(time_limit, ',', 1)), ':', 1)) AS timeLimit,
       ce.competition_id, ro.time_limit, r.person_id, r.person_name, r.country_id
FROM rounds ro
       INNER JOIN competition_events ce ON ce.id = ro.competition_event_id
       INNER JOIN (SELECT DISTINCT competition_id, event_id, round_type_id FROM results
                   WHERE RIGHT(competition_id, 4) >= 2013) re
                  ON re.competition_id = ce.competition_id AND re.event_id = ce.event_id AND
                     (CASE ro.number WHEN ro.total_number_of_rounds THEN re.round_type_id IN ('c', 'f')
                                     WHEN 0 THEN re.round_type_id IN ('0', 'b', 'h') WHEN 1 THEN re.round_type_id IN ('1', 'd')
                                     WHEN 2 THEN re.round_type_id IN ('2', 'e') WHEN 3 THEN re.round_type_id IN ('3', 'g') END)
       JOIN results r ON ce.competition_id=r.competition_id AND ce.event_id=r.event_id AND re.round_type_id=r.round_type_id
WHERE time_limit IS NOT NULL AND time_limit LIKE '%[%"",""%]%'
GROUP BY person_id, competition_id, time_limit
HAVING sumOfSolves>=timeLimit
