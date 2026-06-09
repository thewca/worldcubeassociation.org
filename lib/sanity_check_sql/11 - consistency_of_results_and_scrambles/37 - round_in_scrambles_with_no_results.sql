WITH scramble_rounds AS (
  SELECT DISTINCT
    competition_id,
    event_id,
    round_type_id
  FROM scrambles
),
result_competitions AS (
  SELECT DISTINCT competition_id
  FROM results
),
result_rounds AS (
  SELECT DISTINCT
    competition_id,
    event_id,
    round_type_id
  FROM results
)
SELECT DISTINCT
  s.competition_id,
  s.event_id,
  s.round_type_id
FROM scramble_rounds AS s
LEFT JOIN result_competitions AS r_comps
ON s.competition_id = r_comps.competition_id
LEFT JOIN result_rounds AS r_rounds
ON s.competition_id = r_rounds.competition_id
  AND s.event_id = r_rounds.event_id
  AND s.round_type_id = r_rounds.round_type_id
WHERE r_comps.competition_id IS NOT NULL
  AND r_rounds.competition_id IS NULL
ORDER BY s.competition_id, s.event_id, s.round_type_id;
