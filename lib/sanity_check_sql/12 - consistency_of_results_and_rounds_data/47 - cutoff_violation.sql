SELECT RIGHT(competition_id, 4) AS year,
       TRIM(TRAILING '}' FROM (REVERSE(SUBSTRING_INDEX(REVERSE(cutoff), ':', 1)))) AS attemptResult,
       RIGHT(SUBSTRING_INDEX(cutoff, ',', 1), 1) AS numberOfAttempts, ro.cutoff,
       ce.competition_id, ce.event_id, re.roundTypeId, r.formatId, r.pos, r.personId, r.personName,
       r.value1, r.value2, r.value3, r.value4, r.value5, r.best, r.average
FROM rounds ro
       INNER JOIN competition_events ce ON ce.id = ro.competition_event_id
       INNER JOIN (SELECT DISTINCT competitionId, eventId, roundTypeId FROM Results) re
                  ON re.competitionId = ce.competition_id AND re.eventId = ce.event_id AND
                     (CASE ro.number WHEN ro.total_number_of_rounds THEN re.roundTypeId IN ('c', 'f')
                                     WHEN 0 THEN re.roundTypeId IN ('0', 'b', 'h') WHEN 1 THEN re.roundTypeId IN ('1', 'd')
                                     WHEN 2 THEN re.roundTypeId IN ('2', 'e') WHEN 3 THEN re.roundTypeId IN ('3', 'g') END)
       JOIN Results r ON ce.competition_id=r.competitionId AND ce.event_id=r.eventId
  AND re.roundTypeId=r.roundTypeId
HAVING
  IF(cutoff IS NULL,
     IF(formatId IN ('a', 'm'),
        IF(formatId='m',
           (value2=0 OR value3=0),
           (value2=0 OR value3=0 OR value4=0 OR value5=0)),
        (formatId=2 AND value2=0) OR (formatId=3 AND (value2=0 OR value3=0))),
     CASE WHEN numberOfAttempts=1 THEN (value1<attemptResult AND value1>=0 AND value2=0) OR
                                       ((value1>=attemptResult OR value1<0) AND (value2<>0 OR value3<>0 OR value4<>0 OR value5<>0))
          WHEN numberOfAttempts=2 THEN (((value1<attemptResult AND value1>0) OR
                                         (value2<attemptResult AND value2>0)) AND value3=0) OR ((value1>=attemptResult OR value1<0) AND
                                                                                                (value2>=attemptResult OR value2<0) AND (value3<>0 OR value4<>0 OR value5<>0))
          WHEN numberOfAttempts=3 THEN (((value1<attemptResult AND value1>0) OR
                                         (value2<attemptResult AND value2>0) OR (value3<attemptResult AND value3>0)) AND value4=0) OR
                                       ((value1>=attemptResult OR value1<0) AND (value2>=attemptResult OR value2<0) AND
                                        (value3>=attemptResult OR value3<0) AND (value4<>0 OR value5<>0)) END
       OR formatId=1)
