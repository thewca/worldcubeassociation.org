-- Regulation 9v2: Dual Rounds must not include the final round of a championship.
WITH championship_competition_ids AS (
  SELECT DISTINCT competition_id
  FROM championships
)
SELECT
  RIGHT(ce.competition_id, 4) AS year,
  ce.competition_id,
  ce.event_id,
  ro.number AS final_round_number,
  ro.linked_round_id
FROM rounds AS ro
INNER JOIN competition_events AS ce
ON ce.id = ro.competition_event_id
INNER JOIN competitions AS c
ON c.id = ce.competition_id
INNER JOIN championship_competition_ids AS cci
ON cci.competition_id = ce.competition_id
WHERE ro.linked_round_id IS NOT NULL
  AND ro.number = ro.total_number_of_rounds
  AND c.announced_at IS NOT NULL
ORDER BY year, competition_id, event_id;
