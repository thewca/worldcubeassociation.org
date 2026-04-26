WITH competitions_with_advancement AS (
  SELECT DISTINCT cevents.competition_id AS competition_id
  FROM rounds
  LEFT JOIN competition_events AS cevents
  ON rounds.competition_event_id = cevents.id
  WHERE rounds.advancement_condition IS NOT NULL
),
adv_cond AS (
  SELECT
    rounds.id,
    rounds.competition_event_id,
    rounds.advancement_condition,
    REPLACE(REGEXP_SUBSTR(rounds.advancement_condition, '"(.*?)"', 9), '"', '') AS adv_type,
    REPLACE(REGEXP_SUBSTR(rounds.advancement_condition, '"level":(\\d*)'), '"level":', '') AS adv_count,
    rounds.number AS number,
    rounds.total_number_of_rounds AS total_number_of_rounds,
    cevents.competition_id AS competition_id,
    cevents.event_id AS event_id
  FROM rounds
  LEFT JOIN competition_events AS cevents
  ON rounds.competition_event_id = cevents.id
  WHERE cevents.competition_id IN (SELECT competition_id FROM competitions_with_advancement)
),
re AS (
  SELECT
    results.competition_id,
    results.event_id,
    results.round_type_id,
    COUNT(*) AS participants,
    SUM(IF(best > 0, 1, 0)) AS participants_eligible,
    adv_cond.number,
    adv_cond.adv_type,
    adv_cond.adv_count,
    adv_cond.total_number_of_rounds,
    adv_cond.id AS round_id,
    adv_cond.advancement_condition
  FROM results
  INNER JOIN adv_cond
  ON results.competition_id = adv_cond.competition_id
    AND results.event_id = adv_cond.event_id
    AND (CASE adv_cond.number
      WHEN adv_cond.total_number_of_rounds THEN results.round_type_id IN ('c', 'f')
      WHEN 0 THEN results.round_type_id IN ('0', 'b', 'h')
      WHEN 1 THEN results.round_type_id IN ('1', 'd')
      WHEN 2 THEN results.round_type_id IN ('2', 'e')
      WHEN 3 THEN results.round_type_id IN ('3', 'g')
    END)
  GROUP BY competition_id, event_id, round_type_id, number, adv_type, adv_count, advancement_condition, total_number_of_rounds
),
actual_adv AS (
  SELECT
    re.competition_id,
    re.event_id,
    re.round_id,
    re1.round_type_id,
    re1.number AS number,
    re.total_number_of_rounds,
    re.participants AS participants,
    re.participants_eligible AS participants_eligible,
    re1.participants AS participants_passed,
    IF(re.adv_type = 'percent', FLOOR(re.participants * re.adv_count / 100), re.adv_count) AS adv_real_count,
    re.adv_type,
    re.adv_count,
    re.advancement_condition
  FROM re
  INNER JOIN re AS re1
  ON re.competition_id = re1.competition_id
    AND re.event_id = re1.event_id
    AND re.number = re1.number - 1
  WHERE re.adv_type <> 'attemptResult'
)
SELECT *
FROM actual_adv
WHERE adv_real_count > 0.75 * participants
ORDER BY RIGHT(competition_id, 4), competition_id, event_id, round_type_id;
