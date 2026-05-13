WITH competition_event_counts AS (
  SELECT
    competition_id,
    COUNT(*) AS ce_number_of_events
  FROM competition_events
  GROUP BY competition_id
),
result_event_counts AS (
  SELECT
    competition_id,
    COUNT(DISTINCT event_id) AS results_number_of_events
  FROM results
  GROUP BY competition_id
)
SELECT
  re.competition_id,
  IFNULL(cee.ce_number_of_events, 0) AS ce_number_of_events,
  re.results_number_of_events
FROM competition_event_counts AS cee
RIGHT JOIN result_event_counts AS re
ON cee.competition_id = re.competition_id
HAVING ce_number_of_events <> results_number_of_events;
