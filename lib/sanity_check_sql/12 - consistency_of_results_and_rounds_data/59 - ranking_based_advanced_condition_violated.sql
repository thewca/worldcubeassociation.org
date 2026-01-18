SELECT *
FROM (WITH comps AS (SELECT DISTINCT cevents.competition_id AS competition_id
                     FROM rounds AS rounds
                            LEFT JOIN competition_events AS cevents ON rounds.competition_event_id = cevents.id
                     WHERE NOT rounds.advancement_condition IS NULL),
           adv_cond AS (SELECT rounds.id,
                               rounds.competition_event_id,
                               rounds.advancement_condition,
                               REPLACE(REGEXP_SUBSTR(rounds.advancement_condition, '"(.*?)"', 9), '"', '') AS adv_type,
                               REPLACE(REGEXP_SUBSTR(rounds.advancement_condition, '"level":(\\d*)'), '"level":',
                                       '')                                                                 AS adv_count,
                               rounds.number                                                               AS number,
                               rounds.total_number_of_rounds                                               AS total_number_of_rounds,
                               cevents.competition_id                                                      AS competition_id,
                               cevents.event_id                                                            AS event_id
                        FROM rounds AS rounds
                               LEFT JOIN competition_events AS cevents ON rounds.competition_event_id = cevents.id
                        WHERE cevents.competition_id IN (SELECT competition_id FROM comps)),
           re AS (SELECT results.competition_id,
                         results.event_id,
                         results.round_type_id,
                         COUNT(*)                as participants,
                         SUM(IF(best > 0, 1, 0)) as participants_eligible,
                         adv_cond.number,
                         adv_cond.adv_type,
                         adv_cond.adv_count,
                         adv_cond.total_number_of_rounds,
                         adv_cond.id             AS roundId,
                         adv_cond.advancement_condition
                  FROM results AS results
                         INNER JOIN adv_cond AS adv_cond
                                    ON results.competition_id = adv_cond.competition_id AND
                                       results.event_id = adv_cond.event_id
                                      AND (CASE adv_cond.number
                                             WHEN adv_cond.total_number_of_rounds
                                               THEN results.round_type_id IN ('c', 'f')
                                             WHEN 0 THEN results.round_type_id IN ('0', 'b', 'h')
                                             WHEN 1 THEN results.round_type_id IN ('1', 'd')
                                             WHEN 2 THEN results.round_type_id IN ('2', 'e')
                                             WHEN 3 THEN results.round_type_id IN ('3', 'g')
                                        END)
                  GROUP BY competition_id, event_id, round_type_id, number, adv_type, adv_count, advancement_condition,
                           total_number_of_rounds)
      SELECT re.competition_id,
             re.event_id,
             re.roundId,
             re1.round_type_id,
             re1.number                                                                             AS number,
             re.total_number_of_rounds,
             re.participants                                                                        AS participants,
             re.participants_eligible                                                               AS participants_eligible,
             re1.participants                                                                       AS participants_passed,
             IF(re.adv_type = 'percent', FLOOR(re.participants * re.adv_count / 100), re.adv_count) AS adv_real_count,
             re.adv_type,
             re.adv_count,
             re.advancement_condition
      FROM re AS re
             INNER JOIN re AS re1 ON re.competition_id = re1.competition_id AND re.event_id = re1.event_id AND
                                     re.number = re1.number - 1) AS alls
WHERE adv_type <> 'attemptResult'
  AND alls.adv_real_count > 0.75 * alls.participants
ORDER BY RIGHT(competition_id, 4), competition_id, event_id, round_type_id
