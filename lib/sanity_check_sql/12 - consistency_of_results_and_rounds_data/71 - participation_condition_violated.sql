WITH dest_rounds AS (
  SELECT
    r.id AS round_id,
    r.number AS round_number,
    r.format_id,
    ce.competition_id,
    ce.event_id,
    r.participation_source_type,
    r.participation_source_id,
    r.participation_condition->>'$.type' AS condition_type,
    r.participation_condition->>'$.scope' AS condition_scope,
    CAST(r.participation_condition->>'$.value' AS UNSIGNED) AS condition_value
  FROM rounds AS r
  INNER JOIN competition_events AS ce
  ON r.competition_event_id = ce.id
  WHERE r.participation_condition IS NOT NULL
),
source_round_mapping AS (
  SELECT
    dr.round_id AS dest_round_id,
    dr.condition_scope,
    dr.participation_source_id AS source_round_id
  FROM dest_rounds AS dr
  WHERE dr.participation_source_type = 'Round'

  UNION ALL

  SELECT
    dr.round_id AS dest_round_id,
    dr.condition_scope,
    sr.id AS source_round_id
  FROM dest_rounds AS dr
  INNER JOIN rounds AS sr
  ON dr.participation_source_id = sr.linked_round_id
  WHERE dr.participation_source_type = 'LinkedRound'
),
source_results AS (
  SELECT
    srm.dest_round_id,
    res.person_id,
    res.best,
    IF(srm.condition_scope = 'single', res.best, res.average) AS scope_result
  FROM source_round_mapping AS srm
  INNER JOIN results AS res
  ON res.round_id = srm.source_round_id
),
-- Best scope result per person per destination round; needed both for LinkedRound aggregation and resultAchieved eligible count
person_source_best AS (
  SELECT
    dest_round_id,
    person_id,
    MAX(best) AS max_best,
    -- For LinkedRound sources, take the best valid scope result across both dual rounds per person
    MIN(IF(scope_result > 0, scope_result, NULL)) AS best_scope_result
  FROM source_results
  GROUP BY dest_round_id, person_id
),
source_agg AS (
  SELECT
    psb.dest_round_id,
    COUNT(*) AS participants_source,
    -- Only used for resultAchieved; ranking and percent derive participants_eligible from condition_value directly
    SUM(IF(psb.max_best > 0 AND psb.best_scope_result <= dr.condition_value, 1, 0)) AS participants_eligible_ra
  FROM person_source_best AS psb
  INNER JOIN dest_rounds AS dr
  ON psb.dest_round_id = dr.round_id
  GROUP BY psb.dest_round_id
),
dest_agg AS (
  SELECT
    dr.round_id,
    res.round_type_id,
    COUNT(*) AS participants_dest
  FROM dest_rounds AS dr
  INNER JOIN results AS res
  ON res.round_id = dr.round_id
  GROUP BY dr.round_id, res.round_type_id
),
violations AS (
  SELECT
    dr.competition_id,
    dr.event_id,
    da.round_type_id,
    dr.round_id,
    dr.round_number,
    dr.format_id,
    dr.participation_source_type,
    dr.condition_type,
    dr.condition_scope,
    dr.condition_value,
    sa.participants_source,
    CASE dr.condition_type
      WHEN 'ranking' THEN dr.condition_value
      WHEN 'percent' THEN FLOOR(sa.participants_source * dr.condition_value / 100)
      WHEN 'resultAchieved' THEN sa.participants_eligible_ra
    END AS participants_eligible,
    da.participants_dest
  FROM dest_rounds AS dr
  INNER JOIN source_agg AS sa
  ON dr.round_id = sa.dest_round_id
  INNER JOIN dest_agg AS da
  ON dr.round_id = da.round_id
),
flagged AS (
  SELECT
    *,
    -- WCA regulation: advancement conditions may advance at most 75% of participants
    participants_eligible > 0.75 * participants_source AS too_permissive,
    -- More people advanced than the condition permits
    participants_dest > participants_eligible AS over_advancement
  FROM violations
)
SELECT *
FROM flagged
WHERE too_permissive OR over_advancement
ORDER BY RIGHT(competition_id, 4), competition_id, event_id, round_type_id;
