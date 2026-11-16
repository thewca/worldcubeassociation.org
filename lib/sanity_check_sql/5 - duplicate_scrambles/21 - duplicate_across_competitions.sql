WITH scramble_counts AS (
  SELECT
    scramble,
    SUM(event_id NOT IN ('222', 'skewb')) AS other_count,
    MIN(event_id) AS event_id,
    -- For a scramble shared by exactly two competitions, this is the pair of competitions
    MIN(competition_id) AS first_competition_id,
    MAX(competition_id) AS last_competition_id
  FROM scrambles
  GROUP BY scramble
  HAVING COUNT(*) > 1
),
pair_counts AS (
  SELECT
    scramble,
    other_count,
    first_competition_id,
    last_competition_id,
    SUM(other_count = 0) OVER (
      PARTITION BY first_competition_id, last_competition_id, event_id
    ) AS pair_count
  FROM scramble_counts
),
eligible_scrambles AS (
  SELECT scramble
  FROM pair_counts
  WHERE other_count > 1
    /*
      222 and skewb have such a small scramble space that single duplicates across
      competitions are expected by chance. Several scrambles of the same event shared
      by the same two competitions, however, point to a copied scramble set, e.g.
      scrambles uploaded from the wrong competition. The limit of 3 was tested against
      the live data in November 2026 and produced no false positives, whereas a limit
      of 2 reported 12 pairs of competitions sharing exactly 2 scrambles by chance.
    */
    OR (
      other_count = 0
      AND first_competition_id <> last_competition_id
      AND pair_count >= 3
    )
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
ORDER BY competitions, events, round_type_ids, group_ids, scramble_ids;
