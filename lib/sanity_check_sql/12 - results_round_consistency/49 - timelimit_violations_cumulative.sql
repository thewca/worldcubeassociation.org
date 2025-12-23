SELECT ro.id, COUNT(*) AS noOfRounds, SUM(IF(value1<0,0,value1)+IF(value2<0,0,value2)+IF(value3<0,0,value3)+IF(value4<0,0,value4)+IF(value5<0,0,value5)) AS sumOfSolves,
       REVERSE(SUBSTRING_INDEX(REVERSE(SUBSTRING_INDEX(time_limit, ',', 1)), ':', 1)) AS timeLimit,
       ce.competition_id, ro.time_limit, r.personId, r.personName, r.countryId
FROM rounds ro
       INNER JOIN competition_events ce ON ce.id = ro.competition_event_id
       INNER JOIN (SELECT DISTINCT competitionId, eventId, roundTypeId FROM Results
                   WHERE RIGHT(competitionId, 4) >= 2013) re
                  ON re.competitionId = ce.competition_id AND re.eventId = ce.event_id AND
                     (CASE ro.number WHEN ro.total_number_of_rounds THEN re.roundTypeId IN ('c', 'f')
                                     WHEN 0 THEN re.roundTypeId IN ('0', 'b', 'h') WHEN 1 THEN re.roundTypeId IN ('1', 'd')
                                     WHEN 2 THEN re.roundTypeId IN ('2', 'e') WHEN 3 THEN re.roundTypeId IN ('3', 'g') END)
       JOIN Results r ON ce.competition_id=r.competitionId AND ce.event_id=r.eventId AND re.roundTypeId=r.roundTypeId
WHERE time_limit IS NOT NULL AND time_limit LIKE '%[%"",""%]%'
GROUP BY personId, competition_id, time_limit
HAVING sumOfSolves>=timeLimit
