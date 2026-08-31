WITH result_rounds AS (
  SELECT DISTINCT
    competition_id,
    event_id,
    round_type_id
  FROM results
),
scramble_competitions AS (
  SELECT DISTINCT competition_id
  FROM scrambles
),
scramble_rounds AS (
  SELECT DISTINCT
    competition_id,
    event_id,
    round_type_id
  FROM scrambles
)
SELECT DISTINCT
  r.competition_id,
  r.event_id,
  r.round_type_id
FROM result_rounds AS r
LEFT JOIN scramble_competitions AS s_comps
ON r.competition_id = s_comps.competition_id
LEFT JOIN scramble_rounds AS s_rounds
ON r.competition_id = s_rounds.competition_id
  AND r.event_id = s_rounds.event_id
  AND r.round_type_id = s_rounds.round_type_id
WHERE s_comps.competition_id IS NOT NULL
  AND s_rounds.competition_id IS NULL
ORDER BY r.competition_id, r.event_id, r.round_type_id;
