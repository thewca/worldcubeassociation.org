SELECT RIGHT(ce.competition_id, 4) AS year,
       TRIM(TRAILING '}' FROM (REVERSE(SUBSTRING_INDEX(REVERSE(cutoff), ':', 1)))) AS attemptResult,
       RIGHT(SUBSTRING_INDEX(cutoff, ',', 1), 1) AS numberOfAttempts, ro.cutoff,
       ce.competition_id, ce.event_id, re.round_type_id, r.format_id, r.pos, r.person_id, r.person_name,
       r.value1, r.value2, r.value3, r.value4, r.value5, r.best, r.average
FROM rounds ro
       INNER JOIN competition_events ce ON ce.id = ro.competition_event_id
       INNER JOIN (SELECT DISTINCT competition_id, event_id, round_type_id FROM results) re
                  ON re.competition_id = ce.competition_id AND re.event_id = ce.event_id AND
                     (CASE ro.number WHEN ro.total_number_of_rounds THEN re.round_type_id IN ('c', 'f')
                                     WHEN 0 THEN re.round_type_id IN ('0', 'b', 'h') WHEN 1 THEN re.round_type_id IN ('1', 'd')
                                     WHEN 2 THEN re.round_type_id IN ('2', 'e') WHEN 3 THEN re.round_type_id IN ('3', 'g') END)
       JOIN results r ON ce.competition_id=r.competition_id AND ce.event_id=r.event_id
  AND re.round_type_id=r.round_type_id
HAVING
  IF(cutoff IS NULL,
     IF(format_id IN ('a', 'm'),
        IF(format_id='m',
           (value2=0 OR value3=0),
           (value2=0 OR value3=0 OR value4=0 OR value5=0)),
        (format_id=2 AND value2=0) OR (format_id=3 AND (value2=0 OR value3=0))),
     CASE WHEN numberOfAttempts=1 THEN (value1<attemptResult AND value1>=0 AND value2=0) OR
                                       ((value1>=attemptResult OR value1<0) AND (value2<>0 OR value3<>0 OR value4<>0 OR value5<>0))
          WHEN numberOfAttempts=2 THEN (((value1<attemptResult AND value1>0) OR
                                         (value2<attemptResult AND value2>0)) AND value3=0) OR ((value1>=attemptResult OR value1<0) AND
                                                                                                (value2>=attemptResult OR value2<0) AND (value3<>0 OR value4<>0 OR value5<>0))
          WHEN numberOfAttempts=3 THEN (((value1<attemptResult AND value1>0) OR
                                         (value2<attemptResult AND value2>0) OR (value3<attemptResult AND value3>0)) AND value4=0) OR
                                       ((value1>=attemptResult OR value1<0) AND (value2>=attemptResult OR value2<0) AND
                                        (value3>=attemptResult OR value3<0) AND (value4<>0 OR value5<>0)) END
       OR format_id=1)
