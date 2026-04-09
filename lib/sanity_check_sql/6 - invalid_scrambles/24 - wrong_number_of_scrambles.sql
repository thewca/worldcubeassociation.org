WITH round_results AS (
  SELECT DISTINCT
    competition_id,
    round_type_id,
    format_id,
    event_id
  FROM results
  -- exclude Head-to-Head rounds
  WHERE format_id <> 'h'
),
scramble_counts AS (
  SELECT
    competition_id,
    event_id,
    round_type_id,
    group_id,
    COUNT(*) AS scramble_num
  FROM scrambles
  WHERE is_extra = 0
  GROUP BY competition_id, event_id, round_type_id, group_id
),
scramble_summary AS (
  SELECT
    competition_id,
    event_id,
    round_type_id,
    MIN(scramble_num) AS min_scramble_num,
    MAX(scramble_num) AS max_scramble_num,
    GROUP_CONCAT(
      CONCAT('(', group_id, ', ', scramble_num, ')') ORDER BY group_id SEPARATOR ', ' 
    ) AS group_scramble_nums
  FROM scramble_counts
  GROUP BY competition_id, event_id, round_type_id
)
SELECT
  c.start_date,
  s.competition_id,
  s.event_id,
  s.round_type_id,
  r.format_id,
  f.expected_solve_count,
  s.min_scramble_num,
  s.max_scramble_num,
  s.group_scramble_nums
FROM round_results AS r
INNER JOIN scramble_summary AS s
ON s.competition_id = r.competition_id
  AND s.round_type_id = r.round_type_id
  AND s.event_id = r.event_id
INNER JOIN formats AS f
ON r.format_id = f.id
INNER JOIN competitions AS c
ON s.competition_id = c.id
WHERE ((s.min_scramble_num <> f.expected_solve_count OR s.max_scramble_num <> f.expected_solve_count)
    AND s.event_id <> '333mbf')
  OR (s.max_scramble_num <> f.expected_solve_count AND s.event_id = '333mbf')
ORDER BY c.start_date;
