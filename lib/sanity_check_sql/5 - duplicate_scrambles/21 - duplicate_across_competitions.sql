WITH eligible_scrambles AS (
  SELECT scramble
  FROM scrambles
  WHERE event_id NOT IN ('222', 'skewb')
  GROUP BY scramble
  HAVING COUNT(*) > 1
),
duplicate_scrambles AS (
  SELECT
    s.scramble,
    s.id,
    s.competition_id,
    s.event_id,
    s.round_type_id,
    s.group_id
  FROM eligible_scrambles AS dups
  INNER JOIN scrambles AS s
  ON dups.scramble = s.scramble
)
SELECT
  GROUP_CONCAT(DISTINCT competition_id ORDER BY competition_id) AS competitions,
  GROUP_CONCAT(DISTINCT event_id ORDER BY event_id) AS events,
  GROUP_CONCAT(DISTINCT round_type_id ORDER BY round_type_id) AS round_type_ids,
  GROUP_CONCAT(DISTINCT group_id ORDER BY group_id) AS group_ids,
  scramble,
  COUNT(id) AS scount,
  GROUP_CONCAT(id ORDER BY id) AS scramble_ids
FROM duplicate_scrambles
GROUP BY scramble
HAVING COUNT(DISTINCT competition_id) > 1
ORDER BY competitions, events, round_type_ids, group_ids;
