WITH result_rounds AS (
  SELECT DISTINCT
    competition_id,
    event_id,
    round_type_id
  FROM results
)
SELECT DISTINCT
  RIGHT(ce.competition_id, 4) AS year,
  ce.competition_id,
  ce.event_id,
  re.round_type_id,
  ro.number AS round_number,
  ro.cutoff
FROM rounds AS ro
INNER JOIN competition_events AS ce
ON ce.id = ro.competition_event_id
INNER JOIN result_rounds AS re
ON re.competition_id = ce.competition_id
  AND re.event_id = ce.event_id
  AND (CASE ro.number
    WHEN ro.total_number_of_rounds THEN re.round_type_id IN ('c', 'f')
    WHEN 0 THEN re.round_type_id IN ('0', 'b', 'h')
    WHEN 1 THEN re.round_type_id IN ('1', 'd')
    WHEN 2 THEN re.round_type_id IN ('2', 'e')
    WHEN 3 THEN re.round_type_id IN ('3', 'g')
  END)
WHERE re.round_type_id IN ('c', 'd', 'e', 'g', 'h')
  AND ro.cutoff IS NULL
ORDER BY year, competition_id, event_id, round_number;
