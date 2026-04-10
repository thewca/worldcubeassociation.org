WITH rounds_per_event AS (
  SELECT
    competition_event_id,
    COUNT(*) AS rounds_rounds
  FROM rounds
  GROUP BY competition_event_id
),
result_round_types AS (
  SELECT DISTINCT
    competition_id,
    event_id,
    round_type_id
  FROM results
),
results_per_event AS (
  SELECT
    competition_id,
    event_id,
    COUNT(*) AS result_rounds,
    GROUP_CONCAT(round_type_id ORDER BY round_type_id SEPARATOR ', ') AS id_list
  FROM result_round_types
  GROUP BY competition_id, event_id
)
SELECT DISTINCT
  RIGHT(ce.competition_id, 4) AS year,
  ce.competition_id,
  ce.event_id,
  ro.rounds_rounds,
  res.result_rounds,
  res.id_list,
  IF(ro.rounds_rounds < res.result_rounds, 'rounds entry missing', 'excessive rounds entry') AS problem_case
FROM competition_events AS ce
INNER JOIN rounds_per_event AS ro
ON ce.id = ro.competition_event_id
INNER JOIN results_per_event AS res
ON ce.competition_id = res.competition_id
  AND ce.event_id = res.event_id
  AND ro.rounds_rounds <> res.result_rounds
ORDER BY year, problem_case, competition_id, event_id;
