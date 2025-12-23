SELECT *
FROM (WITH comps AS (SELECT DISTINCT cevents.competition_id AS competition_id, cevents.event_id
                     FROM rounds AS rounds
                            LEFT JOIN competition_events AS cevents ON rounds.competition_event_id = cevents.id
                     WHERE
                       REPLACE(REGEXP_SUBSTR(rounds.advancement_condition, '"(.*?)"', 9), '"', '') = 'attemptResult'),
           adv_cond AS (SELECT rounds.id,
                               rounds.competition_event_id,
                               rounds.advancement_condition,
                               REPLACE(REGEXP_SUBSTR(rounds.advancement_condition, '"(.*?)"', 9), '"', '') AS adv_type,
                               REPLACE(REGEXP_SUBSTR(rounds.advancement_condition, '"level":(\\d*)'), '"level":',
                                       '')                                                                 AS adv_count,
                               rounds.format_id                                                            AS formatid,
                               rounds.number                                                               AS number,
                               rounds.total_number_of_rounds                                               AS total_number_of_rounds,
                               cevents.competition_id                                                      AS competition_id,
                               cevents.event_id                                                            AS event_id
                        FROM `rounds` AS rounds
                               LEFT JOIN competition_events AS cevents
                                         ON rounds.competition_event_id = cevents.id
                        WHERE (cevents.competition_id, cevents.event_id) IN (SELECT competition_id
                                                                                  , event_id
                                                                             FROM comps)),
           re AS (SELECT DISTINCT results.competition_id,
                                  results.event_id,
                                  results.round_type_id,
                                  results.person_id,
                                  results.person_name,
                                  results.best AS result,
                                  adv_cond.number,
                                  adv_cond.adv_type,
                                  adv_cond.adv_count,
                                  adv_cond.total_number_of_rounds,
                                  adv_cond.id  AS roundId,
                                  adv_cond.formatid,
                                  adv_cond.advancement_condition
                  FROM results AS results
                         INNER JOIN adv_cond AS adv_cond ON results.competition_id = adv_cond.competition_id AND
                                                            results.event_id = adv_cond.event_id
                    AND (CASE adv_cond.number
                           WHEN adv_cond.total_number_of_rounds THEN results.round_type_id IN ('c', 'f')
                           WHEN 0 THEN results.round_type_id IN ('0', 'b', 'h')
                           WHEN 1 THEN results.round_type_id IN ('1', 'd')
                           WHEN 2 THEN results.round_type_id IN ('2', 'e')
                           WHEN 3 THEN results.round_type_id IN ('3', 'g')
                      END))
      SELECT re.competition_id,
             re.event_id,
             re.roundId,
             re.round_type_id,
             re.number,
             re.total_number_of_rounds,
             re.person_id,
             re.person_name,
             "",
             re.result,
             re.adv_type,
             re.adv_count,
             re.advancement_condition
      FROM re AS re
             INNER JOIN re AS re1
                        ON re.competition_id = re1.competition_id AND re.event_id = re1.event_id AND
                           re.person_id = re1.person_id AND re.number = re1.number - 1
      WHERE re.result >= re.adv_count
        AND re.adv_type = "attemptResult") AS alls
