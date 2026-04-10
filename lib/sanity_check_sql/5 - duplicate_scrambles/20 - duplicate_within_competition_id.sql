WITH duplicate_scrambles AS (
  SELECT
    competition_id,
    scramble
  FROM scrambles
  GROUP BY competition_id, scramble
  HAVING COUNT(*) > 1
)
SELECT
  s.competition_id,
  GROUP_CONCAT(DISTINCT event_id ORDER BY event_id) AS events,
  GROUP_CONCAT(DISTINCT round_type_id ORDER BY round_type_id) AS round_type_ids,
  GROUP_CONCAT(DISTINCT group_id ORDER BY group_id) AS group_ids,
  s.scramble,
  COUNT(s.id) AS scount,
  GROUP_CONCAT(s.id ORDER BY s.id) AS scramble_ids
FROM duplicate_scrambles AS dups
INNER JOIN scrambles AS s
ON dups.competition_id = s.competition_id
  AND dups.scramble = s.scramble
GROUP BY s.competition_id, s.scramble
ORDER BY s.competition_id, events, round_type_ids, group_ids;
