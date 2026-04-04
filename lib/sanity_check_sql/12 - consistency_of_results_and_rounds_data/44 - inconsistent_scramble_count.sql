WITH scramble_groups AS (
  SELECT DISTINCT
    competition_id,
    event_id,
    round_type_id,
    group_id
  FROM scrambles
),
scramble_set_counts AS (
  SELECT
    competition_id,
    event_id,
    round_type_id,
    COUNT(*) AS scramblesScrambleCount
  FROM scramble_groups
  GROUP BY competition_id, event_id, round_type_id
)
SELECT
  ce.competition_id,
  ce.event_id,
  ro.number AS round_number,
  ro.scramble_set_count AS roundsScrambleCount,
  sc.scramblesScrambleCount
FROM rounds AS ro
INNER JOIN competition_events AS ce
ON ce.id = ro.competition_event_id
INNER JOIN scramble_set_counts AS sc
ON sc.competition_id = ce.competition_id
  AND sc.event_id = ce.event_id
  AND (CASE ro.number
    WHEN ro.total_number_of_rounds THEN sc.round_type_id IN ('c', 'f')
    WHEN 0 THEN sc.round_type_id IN ('0', 'b', 'h')
    WHEN 1 THEN sc.round_type_id IN ('1', 'd')
    WHEN 2 THEN sc.round_type_id IN ('2', 'e')
    WHEN 3 THEN sc.round_type_id IN ('3', 'g')
  END)
WHERE ro.scramble_set_count <> sc.scramblesScrambleCount;
